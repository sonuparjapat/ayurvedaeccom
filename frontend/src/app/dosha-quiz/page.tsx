'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Question { q: string; options: string[] }
interface QuizResult {
  dosha: string; description: string; tips: string[]; categories: string[]
  color: string; emoji: string; vataScore: number; pittaScore: number; kaphaScore: number
}

export default function DoshaQuizPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [step, setStep] = useState(0) // -1 = intro, 0..n-1 = question, n = result
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    axios.get('/quiz/questions').then(r => setQuestions(r.data.questions || [])).catch(() => {})
  }, [])

  const selectAnswer = async (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex]
    setAnswers(newAnswers)
    if (newAnswers.length === questions.length) {
      setLoading(true)
      try {
        const res = await axios.post('/quiz/result', { answers: newAnswers })
        setResult(res.data)
        setStep(questions.length)
      } catch {
        toast.error('Could not save result')
      } finally {
        setLoading(false)
      }
    } else {
      setStep(s => s + 1)
    }
  }

  const restart = () => {
    setAnswers([])
    setStep(0)
    setResult(null)
    setStarted(true)
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-7xl mb-6">🌿</div>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">Discover Your Dosha</h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            In Ayurveda, your <strong>Prakriti</strong> (constitution) is made up of three doshas — Vata, Pitta, and Kapha.
            Take our 10-question quiz to find out your dominant dosha and get personalized wellness recommendations.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="inline-block px-10 py-4 bg-emerald-700 hover:bg-emerald-800 text-white text-lg font-semibold rounded-2xl shadow-lg transition-all hover:scale-105"
          >
            Start the Quiz →
          </button>
          <p className="text-sm text-gray-500 mt-4">Takes about 2 minutes · No sign-in required</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-700 font-medium">Analyzing your dosha...</p>
        </div>
      </div>
    )
  }

  if (result) {
    const doshaColors: Record<string, string> = { Vata: '#7c3aed', Pitta: '#dc2626', Kapha: '#059669' }
    const accent = doshaColors[result.dosha] || '#059669'
    const total = result.vataScore + result.pittaScore + result.kaphaScore

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-8 text-white text-center" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
              <div className="text-6xl mb-3">{result.emoji}</div>
              <p className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-1">Your Dominant Dosha</p>
              <h2 className="text-4xl font-bold">{result.dosha}</h2>
            </div>

            <div className="p-8 space-y-8">
              {/* Score bars */}
              <div className="space-y-3">
                {[
                  { label: 'Vata 🌬️', score: result.vataScore, color: '#7c3aed' },
                  { label: 'Pitta 🔥', score: result.pittaScore, color: '#dc2626' },
                  { label: 'Kapha 🌊', score: result.kaphaScore, color: '#059669' },
                ].map(({ label, score, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>{label}</span>
                      <span>{Math.round((score / total) * 100)}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(score / total) * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">About You</h3>
                <p className="text-gray-600 leading-relaxed">{result.description}</p>
              </div>

              {/* Tips */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Your Wellness Tips</h3>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-gray-700 text-sm">
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ backgroundColor: accent }}>✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended categories */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Recommended For You</h3>
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((cat, i) => (
                    <Link
                      key={i}
                      href={`/products?search=${encodeURIComponent(cat)}`}
                      className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
                      style={{ borderColor: accent, color: accent, background: `${accent}12` }}
                    >
                      {cat} →
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={restart} className="flex-1 py-3 border-2 border-emerald-600 text-emerald-700 rounded-2xl font-semibold hover:bg-emerald-50 transition-all">
                  Retake Quiz
                </button>
                <Link href="/products" className="flex-1 py-3 text-center text-white rounded-2xl font-semibold transition-all" style={{ backgroundColor: accent }}>
                  Shop Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const current = questions[step]
  if (!current) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-medium text-emerald-700 mb-2">
            <span>Question {step + 1} of {questions.length}</span>
            <span>{Math.round(((step) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${(step / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-4xl mb-5 text-center">🌿</div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8 leading-snug">{current.q}</h2>

          <div className="space-y-3">
            {current.options.map((option, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className="w-full text-left px-5 py-4 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 font-medium transition-all duration-150 active:scale-[0.98]"
              >
                <span className="inline-block w-6 h-6 rounded-full border-2 border-gray-300 mr-3 text-xs font-bold text-center leading-5 text-gray-500">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {step > 0 && (
          <button
            onClick={() => { setStep(s => s - 1); setAnswers(a => a.slice(0, -1)) }}
            className="mt-4 text-sm text-emerald-700 hover:underline w-full text-center"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
