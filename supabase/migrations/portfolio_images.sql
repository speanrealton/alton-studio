-- Create portfolio_images table
create table if not exists public.portfolio_images (
  id uuid default uuid_generate_v4() primary key,
  printer_id uuid not null references public.printers(id) on delete cascade,
  title text not null,
  description text,
  image_url text not null,
  storage_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on printer_id for faster queries
create index if not exists portfolio_images_printer_id_idx on public.portfolio_images(printer_id);

-- Enable RLS
alter table public.portfolio_images enable row level security;

-- RLS Policies
create policy "Printers can view own portfolio"
  on public.portfolio_images for select
  using (
    auth.uid() = (select user_id from public.printers where id = printer_id)
  );

create policy "Printers can insert own portfolio"
  on public.portfolio_images for insert
  with check (
    auth.uid() = (select user_id from public.printers where id = printer_id)
  );

create policy "Printers can update own portfolio"
  on public.portfolio_images for update
  using (
    auth.uid() = (select user_id from public.printers where id = printer_id)
  );

create policy "Printers can delete own portfolio"
  on public.portfolio_images for delete
  using (
    auth.uid() = (select user_id from public.printers where id = printer_id)
  );

create policy "Public can view portfolio"
  on public.portfolio_images for select
  using (true);
