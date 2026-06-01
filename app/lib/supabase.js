import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yypxmsjyzplvtnkmnvgp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cHhtc2p5enBsdnRua21udmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzIyNDAsImV4cCI6MjA5NTgwODI0MH0.CFsBlIHMUtryxFn_vkdWtAJT1GT03lrS_e4AcIhDnZ0";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);