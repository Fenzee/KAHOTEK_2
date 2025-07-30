-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public quizzes" ON public.quizzes
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own quizzes" ON public.quizzes
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own quizzes" ON public.quizzes
  FOR DELETE USING (creator_id = auth.uid());
