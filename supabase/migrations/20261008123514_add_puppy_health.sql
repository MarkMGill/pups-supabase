ALTER TABLE public.puppies
ADD COLUMN health text
CHECK (health IN ('good', 'bad'));