// src/app/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const steps = [
  {
    title: "What do you mostly design?",
    type: "multi",
    options: ["Business Cards & Flyers", "Social Media Posts", "Logos & Branding", "T-Shirts & Merch", "Posters & Banners", "Church Programs", "Wedding Invitations", "YouTube Thumbnails"]
  },
  {
    title: "Your favorite style?",
    type: "single",
    options: ["Luxury & Gold", "Minimal & Clean", "African Patterns", "Neon & Cyberpunk", "Retro/Vintage", "Bold & Colorful"]
  },
  {
    title: "Where are you designing from?",
    type: "single",
    options: ["Kampala", "Nairobi", "Lagos", "Accra", "Dar es Salaam", "Addis Ababa", "Johannesburg", "Other Africa", "Outside Africa"]
  },
  {
    title: "Want to earn money selling templates?",
    type: "yesno"
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('user_profiles').select('onboarding_completed').eq('user_id', user.id).single();
        if (data?.onboarding_completed) router.replace('/home');
      }
    };
    check();
  }, [router]);

  const saveAndNext = async () => {
    if (step === steps.length - 1) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('user_profiles').upsert({
        user_id: user?.id,
        design_types: answers.design_types,
        preferred_style: answers.preferred_style,
        location: answers.location,
        is_creator: answers.is_creator,
        onboarding_completed: true
      });
      router.replace('/home');
    } else {
      setStep(step + 1);
    }
  };

  const current = steps[step];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          key={step}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white/5 rounded-3xl p-10"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-black mb-2">{current.title}</h2>
            <p className="text-gray-400">Step {step + 1} of {steps.length}</p>
          </div>

          {current.type === "multi" && (
            <div className="space-y-3">
              {current.options.map((opt) => (
                <label key={opt} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={answers.design_types?.includes(opt)}
                    onChange={(e) => {
                      const arr = answers.design_types || [];
                      setAnswers({ ...answers, design_types: e.target.checked ? [...arr, opt] : arr.filter((x: string) => x !== opt) });
                    }}
                    className="w-6 h-6 rounded accent-purple-500"
                  />
                  <span className="text-lg">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {current.type === "single" && (
            <div className="grid grid-cols-2 gap-4">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [step === 1 ? 'preferred_style' : 'location']: opt })}
                  className={`p-6 rounded-2xl border-2 transition ${answers[step === 1 ? 'preferred_style' : 'location'] === opt ? 'border-purple-500 bg-purple-500/20' : 'border-white/20'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {current.type === "yesno" && (
            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => { setAnswers({ ...answers, is_creator: true }); saveAndNext(); }} className="p-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl font-bold text-xl">
                Yes, make me a creator!
              </button>
              <button onClick={() => { setAnswers({ ...answers, is_creator: false }); saveAndNext(); }} className="p-10 bg-white/10 rounded-3xl font-bold text-xl border border-white/20">
                Just designing for now
              </button>
            </div>
          )}

          {current.type !== "yesno" && (
            <button
              onClick={saveAndNext}
              disabled={!answers[step === 0 ? 'design_types' : step === 1 ? 'preferred_style' : 'location']}
              className="mt-10 w-full py-6 bg-purple-600 disabled:bg-gray-600 rounded-full font-bold text-xl"
            >
              {step === steps.length - 1 ? 'Finish & Start Designing' : 'Next'}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}