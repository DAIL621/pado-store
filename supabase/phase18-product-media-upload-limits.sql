-- Product media bucket must allow the largest supported media type (80MB video).
-- Application/API validation remains stricter by purpose:
-- product image 5MB, legacy detail image 20MB, video thumbnail 10MB, video 80MB.
-- Change `product-images` below if production uses a different bucket name.

update storage.buckets
set
  file_size_limit = 83886080,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
where id = 'product-images' or name = 'product-images';

select id, name, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-images' or name = 'product-images';
