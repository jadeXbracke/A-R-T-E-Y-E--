// Live backend. Cycle data is the exception: it is deliberately kept on the
// device (demo store) and never written to Supabase — see DATAPRIVACY in
// PROJECTPLAN.md.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Api } from './api-types';
import { demoApi } from './demo-store';
import {
  CalendarEvent, Checkin, Habit, HealthLog, InboxItem, KnowledgeEntry, Mark, Pillar,
} from './types';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true } },
);

async function userId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in.');
  return data.user.id;
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const pillarRow = (r: any): Pillar =>
  ({ id: r.id, name: r.name, position: r.position, archived: r.archived });
const habitRow = (r: any): Habit =>
  ({ id: r.id, pillarId: r.pillar_id, name: r.name, targetPerWeek: r.target_per_week, position: r.position, archived: r.archived });
const markRow = (r: any): Mark => ({ id: r.id, habitId: r.habit_id, date: r.date });
const healthRow = (r: any): HealthLog => ({ id: r.id, kind: r.kind, date: r.date, payload: r.payload ?? {} });
const inboxRow = (r: any): InboxItem =>
  ({ id: r.id, kind: r.kind, text: r.text, done: r.done, createdAt: r.created_at });
const knowledgeRow = (r: any): KnowledgeEntry =>
  ({ id: r.id, kind: r.kind, title: r.title, insight: r.insight, createdAt: r.created_at });
const eventRow = (r: any): CalendarEvent =>
  ({ id: r.id, title: r.title, start: r.start_at, end: r.end_at, source: r.source, externalId: r.external_id ?? undefined });

export const supabaseApi: Api = {
  async getSessionProfile() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return { id: data.user.id, email: data.user.email ?? '' };
  },
  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    fail(error);
  },
  async signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    fail(error);
  },
  async signOut() {
    await supabase.auth.signOut();
  },

  async listPillars() {
    const { data, error } = await supabase.from('pillars')
      .select('*').eq('archived', false).order('position');
    fail(error);
    return (data ?? []).map(pillarRow);
  },
  async createPillar(name) {
    const { data, error } = await supabase.from('pillars')
      .insert({ user_id: await userId(), name }).select().single();
    fail(error);
    return pillarRow(data);
  },
  async archivePillar(id) {
    fail((await supabase.from('pillars').update({ archived: true }).eq('id', id)).error);
    fail((await supabase.from('habits').update({ archived: true }).eq('pillar_id', id)).error);
  },
  async listHabits() {
    const { data, error } = await supabase.from('habits')
      .select('*').eq('archived', false).order('position');
    fail(error);
    return (data ?? []).map(habitRow);
  },
  async createHabit(pillarId, name, targetPerWeek) {
    const { data, error } = await supabase.from('habits')
      .insert({ user_id: await userId(), pillar_id: pillarId, name, target_per_week: targetPerWeek })
      .select().single();
    fail(error);
    return habitRow(data);
  },
  async archiveHabit(id) {
    fail((await supabase.from('habits').update({ archived: true }).eq('id', id)).error);
  },

  async listMarks(from, to) {
    const { data, error } = await supabase.from('marks')
      .select('*').gte('date', from).lte('date', to);
    fail(error);
    return (data ?? []).map(markRow);
  },
  async toggleMark(habitId, date) {
    const { data, error } = await supabase.from('marks')
      .select('id').eq('habit_id', habitId).eq('date', date).maybeSingle();
    fail(error);
    if (data) {
      fail((await supabase.from('marks').delete().eq('id', data.id)).error);
      return false;
    }
    fail((await supabase.from('marks')
      .insert({ user_id: await userId(), habit_id: habitId, date })).error);
    return true;
  },

  async listHealthLogs(kind, from, to) {
    if (kind === 'cycle') return demoApi.listHealthLogs(kind, from, to); // device-only
    const { data, error } = await supabase.from('health_logs')
      .select('*').eq('kind', kind).gte('date', from).lte('date', to)
      .order('date', { ascending: false });
    fail(error);
    return (data ?? []).map(healthRow);
  },
  async addHealthLog(kind, date, payload) {
    if (kind === 'cycle') return demoApi.addHealthLog(kind, date, payload); // device-only
    const { data, error } = await supabase.from('health_logs')
      .insert({ user_id: await userId(), kind, date, payload }).select().single();
    fail(error);
    return healthRow(data);
  },

  async listInbox() {
    const { data, error } = await supabase.from('inbox_items')
      .select('*').order('created_at', { ascending: false });
    fail(error);
    return (data ?? []).map(inboxRow);
  },
  async addInbox(kind, text) {
    const { data, error } = await supabase.from('inbox_items')
      .insert({ user_id: await userId(), kind, text }).select().single();
    fail(error);
    return inboxRow(data);
  },
  async toggleInboxDone(id) {
    const { data, error } = await supabase.from('inbox_items')
      .select('done').eq('id', id).single();
    fail(error);
    fail((await supabase.from('inbox_items').update({ done: !data!.done }).eq('id', id)).error);
  },
  async deleteInbox(id) {
    fail((await supabase.from('inbox_items').delete().eq('id', id)).error);
  },

  async listKnowledge() {
    const { data, error } = await supabase.from('knowledge_entries')
      .select('*').order('created_at', { ascending: false });
    fail(error);
    return (data ?? []).map(knowledgeRow);
  },
  async addKnowledge(kind, title, insight) {
    const { data, error } = await supabase.from('knowledge_entries')
      .insert({ user_id: await userId(), kind, title, insight }).select().single();
    fail(error);
    return knowledgeRow(data);
  },

  async listEvents(from, to) {
    const { data, error } = await supabase.from('calendar_events')
      .select('*').gte('start_at', `${from}T00:00:00`).lte('start_at', `${to}T23:59:59`)
      .order('start_at');
    fail(error);
    return (data ?? []).map(eventRow);
  },
  async addEvent(title, start, end) {
    const { data, error } = await supabase.from('calendar_events')
      .insert({ user_id: await userId(), title, start_at: start, end_at: end, source: 'mark' })
      .select().single();
    fail(error);
    return eventRow(data);
  },
  async deleteEvent(id) {
    fail((await supabase.from('calendar_events').delete().eq('id', id)).error);
  },

  async getCheckin(kind, periodStart) {
    const { data, error } = await supabase.from('checkins')
      .select('*').eq('kind', kind).eq('period_start', periodStart).maybeSingle();
    fail(error);
    if (!data) return null;
    return { kind: data.kind, periodStart: data.period_start, answers: data.answers as Checkin['answers'] };
  },
  async saveCheckin(kind, periodStart, answers) {
    fail((await supabase.from('checkins')
      .upsert(
        { user_id: await userId(), kind, period_start: periodStart, answers },
        { onConflict: 'user_id,kind,period_start' },
      )).error);
  },
};
