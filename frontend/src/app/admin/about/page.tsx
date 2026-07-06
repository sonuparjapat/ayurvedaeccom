'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { notify } from '@/app/utils/notify'
import {
  BookOpen, Plus, Trash2, Save, Loader2, Eye,
} from 'lucide-react'
import Link from 'next/link'

/* ================= TYPES ================= */

interface ValueItem {
  icon: string
  title: string
  description: string
}

interface MilestoneItem {
  year: string
  title: string
  description: string
}

interface TeamMember {
  name: string
  role: string
  image: string
  description: string
}

interface AboutData {
  hero_title: string
  hero_description: string
  values: ValueItem[]
  milestones: MilestoneItem[]
  team: TeamMember[]
  cta_title: string
  cta_description: string
}

/* ================= DEFAULT DATA ================= */

const emptyAbout: AboutData = {
  hero_title: '',
  hero_description: '',
  values: [],
  milestones: [],
  team: [],
  cta_title: '',
  cta_description: '',
}

export default function AdminAboutPage() {

  const [company, setCompany] = useState<any>(null)
  const [about, setAbout] = useState<AboutData>({ ...emptyAbout })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  /* ================= LOAD ================= */

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/company')
      const list = res.data.data || []
      if (list.length > 0) {
        const c = list[0]
        setCompany(c)
        const existing = c.extra_data?.about
        if (existing) {
          setAbout({
            hero_title: existing.hero_title || '',
            hero_description: existing.hero_description || '',
            values: existing.values || [],
            milestones: existing.milestones || [],
            team: existing.team || [],
            cta_title: existing.cta_title || '',
            cta_description: existing.cta_description || '',
          })
        }
      }
    } catch {
      notify.error('Failed to load company data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!company) {
      notify.error('No company found. Please create a company first in Company Settings.')
      return
    }

    setSaving(true)
    try {
      const currentExtraData = company.extra_data || {}
      const updatedExtraData = { ...currentExtraData, about }
      await axios.put(`/company/${company.id}`, {
        extra_data: JSON.stringify(updatedExtraData),
      })
      notify.success('About page saved successfully!')
      // Update local company state so next save merges correctly
      setCompany({ ...company, extra_data: updatedExtraData })
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  /* ================= VALUE HELPERS ================= */

  const addValue = () => {
    setAbout(prev => ({
      ...prev,
      values: [...prev.values, { icon: '🌿', title: '', description: '' }],
    }))
  }

  const updateValue = (index: number, field: keyof ValueItem, value: string) => {
    setAbout(prev => {
      const updated = [...prev.values]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, values: updated }
    })
  }

  const removeValue = (index: number) => {
    setAbout(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }))
  }

  /* ================= MILESTONE HELPERS ================= */

  const addMilestone = () => {
    setAbout(prev => ({
      ...prev,
      milestones: [...prev.milestones, { year: new Date().getFullYear().toString(), title: '', description: '' }],
    }))
  }

  const updateMilestone = (index: number, field: keyof MilestoneItem, value: string) => {
    setAbout(prev => {
      const updated = [...prev.milestones]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, milestones: updated }
    })
  }

  const removeMilestone = (index: number) => {
    setAbout(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }))
  }

  /* ================= TEAM HELPERS ================= */

  const addTeamMember = () => {
    setAbout(prev => ({
      ...prev,
      team: [...prev.team, { name: '', role: '', image: '', description: '' }],
    }))
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setAbout(prev => {
      const updated = [...prev.team]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, team: updated }
    })
  }

  const removeTeamMember = (index: number) => {
    setAbout(prev => ({
      ...prev,
      team: prev.team.filter((_, i) => i !== index),
    }))
  }

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">About Page Editor</h1>
              <p className="text-emerald-100 text-sm">Manage your About page content</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/about"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {!company && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          No company found. Please create a company in{' '}
          <Link href="/admin/company" className="underline font-medium">Company Settings</Link>{' '}
          first.
        </div>
      )}

      {/* ================= HERO SECTION ================= */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Hero Section</h2>
        <p className="text-sm text-gray-500 mb-4">The main banner area at the top of the About page</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g. Bringing Ancient Ayurvedic Wisdom to Modern Wellness"
              value={about.hero_title}
              onChange={(e) => setAbout(prev => ({ ...prev, hero_title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              placeholder="e.g. Founded in 2024, Oroganix is on a mission to make authentic Ayurvedic products accessible to everyone..."
              value={about.hero_description}
              onChange={(e) => setAbout(prev => ({ ...prev, hero_description: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* ================= VALUES SECTION ================= */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Values</h2>
          <button
            onClick={addValue}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
          >
            <Plus className="w-4 h-4" />
            Add Value
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Core values displayed as cards. Use emojis for icons.</p>

        {about.values.length === 0 && (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            No values added yet. Click "Add Value" to get started. Defaults will be shown on the page if empty.
          </p>
        )}

        <div className="space-y-4">
          {about.values.map((val, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="🌿"
                      value={val.icon}
                      onChange={(e) => updateValue(i, 'icon', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. 100% Natural"
                      value={val.title}
                      onChange={(e) => updateValue(i, 'title', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeValue(i)}
                  className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Remove value"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="e.g. All our products are sourced directly from farms without any preservatives..."
                  value={val.description}
                  onChange={(e) => updateValue(i, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MILESTONES SECTION ================= */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Journey Milestones</h2>
          <button
            onClick={addMilestone}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Timeline events displayed on the About page journey section</p>

        {about.milestones.length === 0 && (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            No milestones added yet. Click "Add Milestone" to get started. Defaults will be shown if empty.
          </p>
        )}

        <div className="space-y-4">
          {about.milestones.map((ms, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. 2024"
                      value={ms.year}
                      onChange={(e) => updateMilestone(i, 'year', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. Our Journey Begins"
                      value={ms.title}
                      onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeMilestone(i)}
                  className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Remove milestone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="e.g. Started with a vision to bring authentic Ayurvedic products online"
                  value={ms.description}
                  onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TEAM SECTION ================= */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <button
            onClick={addTeamMember}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Team members shown on the About page. Use image URLs or emojis.</p>

        {about.team.length === 0 && (
          <p className="text-sm text-gray-400 italic py-4 text-center">
            No team members added yet. Click "Add Member" to get started. Defaults will be shown if empty.
          </p>
        )}

        <div className="space-y-4">
          {about.team.map((member, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. Sonu"
                      value={member.name}
                      onChange={(e) => updateTeamMember(i, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. Founder & CEO"
                      value={member.role}
                      onChange={(e) => updateTeamMember(i, 'role', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Image URL <span className="text-gray-400">(leave empty for default avatar)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="e.g. https://example.com/photo.jpg or an emoji like 👨‍💼"
                      value={member.image}
                      onChange={(e) => updateTeamMember(i, 'image', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeTeamMember(i)}
                  className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="e.g. Passionate about bringing authentic Ayurvedic wellness to modern India."
                  value={member.description}
                  onChange={(e) => updateTeamMember(i, 'description', e.target.value)}
                />
              </div>

              {/* Image Preview */}
              {member.image && member.image.startsWith('http') && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={member.image}
                    alt={member.name || 'Preview'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-xs text-gray-400">Image preview</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= CTA SECTION ================= */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Call to Action Section</h2>
        <p className="text-sm text-gray-500 mb-4">The green banner at the bottom of the About page</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g. Join Our Wellness Community"
              value={about.cta_title}
              onChange={(e) => setAbout(prev => ({ ...prev, cta_title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              placeholder="e.g. Be part of a movement that's bringing authentic Ayurvedic wellness to modern India..."
              value={about.cta_description}
              onChange={(e) => setAbout(prev => ({ ...prev, cta_description: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SAVE ================= */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

    </div>
  )
}
