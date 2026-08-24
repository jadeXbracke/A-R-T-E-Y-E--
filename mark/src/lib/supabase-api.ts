// Live backend. Cycle data is the exception: it is deliberately kept on the
// device (demo store) and never written to Supabase — see DATAPRIVACY in
// PROJECTPLAN.md.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Api } from './api-types';
import { demoApi } from './demo-store';
import {
  CalendarEvent, Habit, HealthLog, KnowledgeEntry, Mark, Pillar, Reflection,
} from './types';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true } },
);

async function userId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Niet ingelogd.');
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

  async getReflection(weekStart) {
    const { data, error } = await supabase.from('reflections')
      .select('*').eq('week_start', weekStart).maybeSingle();
    fail(error);
    if (!data) return null;
    return { weekStart: data.week_start, answers: data.answers as Reflection['answers'] };
  },
  async saveReflection(weekStart, answers) {
    fail((await supabase.from('reflections')
      .upsert({ user_id: await userId(), week_start: weekStart, answers }, { onConflict: 'user_id,week_start' })).error);
  },
};
