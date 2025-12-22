-- Add order_status column to quote_requests if it doesn't exist
alter table if exists public.quote_requests
add column if not exists order_status text default 'in_progress' check (order_status in ('in_progress', 'completed'));

-- Create index for faster filtering
create index if not exists quote_requests_order_status_idx on public.quote_requests(order_status);
