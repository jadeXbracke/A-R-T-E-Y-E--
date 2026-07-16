-- ART EYE — storage bucket for exhibition images.
-- Public read; anyone may upload into the bucket (submissions can come from
-- the anonymous public form). Nothing is shown publicly until an admin
-- approves the exhibition row that references the image.

insert into storage.buckets (id, name, public)
values ('exhibition-images', 'exhibition-images', true)
on conflict (id) do nothing;

create policy "exhibition images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'exhibition-images');

create policy "anyone can upload exhibition images"
  on storage.objects for insert
  with check (bucket_id = 'exhibition-images');
