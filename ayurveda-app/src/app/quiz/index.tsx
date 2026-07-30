import React, { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, ScrollView, StatusBar, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import api from '../../api/axios'
import { Colors, Fonts } from '../../constants/theme'
import { notify as hapticNotify, Haptics } from '../../utils/haptics'

const { width: W } = Dimensions.get('window')

interface Question { q: string; options: string[] }
interface QuizResult {
  dosha: string; description: string; tips: string[]; categories: string[]
  color: string; emoji: string; vataScore: number; pittaScore: number; kaphaScore: number
}

const DOSHA_COLORS: Record<string, [string, string]> = {
  Vata: ['#7c3aed', '#4c1d95'],
  Pitta: ['#dc2626', '#991b1b'],
  Kapha: ['#059669', '#065f46'],
}

export default function DoshaQuizScreen() {
  const insets = useSafeAreaInsets()
  const [questions, setQuestions] = useState<Question[]>([])
  const [step, setStep] = useState(-1) // -1 = intro
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    api.get('/quiz/questions').then(r => setQuestions(r.data.questions || [])).catch(() => {})
  }, [])

  const animateTransition = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      cb()
      slideAnim.setValue(30)
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    })
  }

  const selectAnswer = async (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex]
    if (newAnswers.length === questions.length) {
      setLoading(true)
      try {
        const res = await api.post('/quiz/result', { answers: newAnswers })
        hapticNotify(Haptics.NotificationFeedbackType.Success)
        setAnswers(newAnswers)
        setResult(res.data)
        animateTransition(() => setStep(questions.length))
      } catch {
        // still show result client-side
        const vata = newAnswers.filter(a => a === 0).length
        const pitta = newAnswers.filter(a => a === 1).length
        const kapha = newAnswers.filter(a => a === 2).length
        const dosha = vata >= pitta && vata >= kapha ? 'Vata' : pitta >= kapha ? 'Pitta' : 'Kapha'
        setResult({ dosha, description: '', tips: [], categories: [], color: '#059669', emoji: '🌿', vataScore: vata, pittaScore: pitta, kaphaScore: kapha })
        setStep(questions.length)
      } finally {
        setLoading(false)
      }
    } else {
      animateTransition(() => {
        setAnswers(newAnswers)
        setStep(s => s + 1)
      })
    }
  }

  const restart = () => {
    animateTransition(() => {
      setAnswers([])
      setResult(null)
      setStep(0)
    })
  }

  // INTRO
  if (step === -1) {
    return (
      <LinearGradient colors={['#0a1f14', '#1a4228']} style={{ flex: 1, paddingTop: insets.top }}>
        <StatusBar barStyle="light-content" />
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 16, paddingBottom: 0 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 72, marginBottom: 20 }}>🌿</Text>
          <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 28, textAlign: 'center', marginBottom: 12 }}>
            Discover Your Dosha
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.regular, fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
            In Ayurveda, your Prakriti is made up of three doshas — Vata, Pitta, and Kapha. Answer 10 questions to find your dominant type and get personalized wellness recommendations.
          </Text>
          <TouchableOpacity
            onPress={() => animateTransition(() => setStep(0))}
            style={{ backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 40, paddingVertical: 16, width: '100%', alignItems: 'center' }}
          >
            <Text style={{ color: '#0a1f14', fontFamily: Fonts.bold, fontSize: 17 }}>Start the Quiz →</Text>
          </TouchableOpacity>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 }}>Takes about 2 minutes · Free</Text>
        </View>
      </LinearGradient>
    )
  }

  // LOADING
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🌿</Text>
        <Text style={{ fontFamily: Fonts.bold, color: Colors.forest, fontSize: 16 }}>Analyzing your dosha…</Text>
      </View>
    )
  }

  // RESULT
  if (result && step === questions.length) {
    const colors = DOSHA_COLORS[result.dosha] || ['#059669', '#065f46']
    const total = result.vataScore + result.pittaScore + result.kaphaScore || 1
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={colors} style={{ paddingTop: insets.top + 16, paddingBottom: 32, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 10, left: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 56, marginBottom: 8 }}>{result.emoji || '🌿'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Your Dominant Dosha</Text>
          <Text style={{ color: '#fff', fontFamily: Fonts.bold, fontSize: 36 }}>{result.dosha}</Text>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}>
          {/* Score bars */}
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16 }}>
            {[
              { label: 'Vata 🌬️', score: result.vataScore, color: '#7c3aed' },
              { label: 'Pitta 🔥', score: result.pittaScore, color: '#dc2626' },
              { label: 'Kapha 🌊', score: result.kaphaScore, color: '#059669' },
            ].map(({ label, score, color }) => (
              <View key={label} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: Colors.forest }}>{label}</Text>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color }}>{Math.round((score / total) * 100)}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${(score / total) * 100}%`, backgroundColor: color, borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>

          {/* Description */}
          {result.description ? (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.forest, marginBottom: 8 }}>About You</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textDim, lineHeight: 22 }}>{result.description}</Text>
            </View>
          ) : null}

          {/* Tips */}
          {result.tips?.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.forest, marginBottom: 10 }}>Your Wellness Tips</Text>
              {result.tips.map((tip, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors[0], alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                  </View>
                  <Text style={{ flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.forest, lineHeight: 20 }}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          <View style={{ gap: 10 }}>
            <TouchableOpacity onPress={restart} style={{ borderWidth: 2, borderColor: Colors.forest, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ fontFamily: Fonts.bold, color: Colors.forest, fontSize: 15 }}>Retake Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/products')}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient colors={colors} style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.bold, color: '#fff', fontSize: 15 }}>Shop Products →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    )
  }

  // QUESTION
  const current = questions[step]
  if (!current) return null
  const progress = step / questions.length

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={() => step === 0 ? animateTransition(() => setStep(-1)) : animateTransition(() => { setAnswers(a => a.slice(0, -1)); setStep(s => s - 1) })}>
          <Text style={{ color: Colors.forest, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: Fonts.medium, fontSize: 11, color: Colors.textDim }}>Question {step + 1} of {questions.length}</Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.forest }}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: Colors.mint, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: Colors.forest, borderRadius: 3 }} />
          </View>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }], padding: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🌿</Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.forest, textAlign: 'center', lineHeight: 26 }}>
            {current.q}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {current.options.map((option, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => selectAnswer(i)}
              activeOpacity={0.8}
              style={s.optionBtn}
            >
              <View style={s.optionBadge}>
                <Text style={s.optionBadgeText}>{String.fromCharCode(65 + i)}</Text>
              </View>
              <Text style={s.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  optionBadge: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.mint,
    alignItems: 'center', justifyContent: 'center', shrink: 0,
  },
  optionBadgeText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.forest },
  optionText: { flex: 1, fontFamily: Fonts.medium, fontSize: 14, color: Colors.forest, lineHeight: 20 },
})
