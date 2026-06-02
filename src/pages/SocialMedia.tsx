import { useState, useRef } from 'react'
import { Image, Send, Clock, ThumbsUp, MessageCircle, Share, Link2, CheckCircle2 } from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { SocialPost } from '../types'

type Platform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin'

const PLATFORMS: { id: Platform; label: string; color: string; bg: string; connected: boolean }[] = [
  { id: 'facebook',  label: 'Facebook',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',   connected: true },
  { id: 'instagram', label: 'Instagram', color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200',   connected: true },
  { id: 'tiktok',    label: 'TikTok',    color: 'text-slate-900',  bg: 'bg-slate-50 border-slate-200', connected: false },
  { id: 'linkedin',  label: 'LinkedIn',  color: 'text-blue-700',   bg: 'bg-sky-50 border-sky-200',     connected: false },
]

const POST_TEMPLATES: Record<Platform, string> = {
  facebook: `📣 [Your attention-grabbing hook here]

[Share the story or value — 2–3 sentences that make people stop scrolling]

[Your call-to-action: "Book now", "Learn more", "Comment below"]

#YourBrand #Hashtag1 #Hashtag2`,

  instagram: `✨ [Bold hook — first line is everything]

[Tell your story or share your value in a few lines]
[Add emojis to break up text 🎯]

👇 [CTA — "Link in bio", "DM us", "Tag a friend"]

.
.
.
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6
#niche #industry #brand #trending`,

  tiktok: `🎵 [Hook — what happens in the first 3 seconds?]

[Main content: value, entertainment, or story]
[Keep it punchy — TikTok rewards brevity]

[CTA: "Follow for more", "Comment your answer"]

#fyp #foryou #trending #YourNiche #SmallBusiness`,

  linkedin: `🔑 [Professional insight or bold statement]

[Context: Why does this matter? What problem does it solve?]
[Your story or data point — be specific]

Key takeaways:
• [Point 1]
• [Point 2]
• [Point 3]

[Closing thought or question to spark conversation]

#Industry #Leadership #GrowthMindset #YourNiche`,
}

const PLATFORM_ICONS: Record<Platform, string> = {
  facebook: 'f', instagram: '📷', tiktok: '♪', linkedin: 'in',
}

const recentPosts: SocialPost[] = [
  { id: '1', platform: 'facebook', content: 'Summer sale is here! 20% off all services this week only...', status: 'published', publishedAt: '2025-06-01', likes: 84, comments: 12, shares: 21, reach: 1420 },
  { id: '2', platform: 'instagram', content: 'Behind the scenes of our team at work ✨', status: 'published', publishedAt: '2025-05-30', likes: 213, comments: 34, shares: 8, reach: 3100 },
  { id: '3', platform: 'linkedin', content: 'Proud to announce we crossed $1M in annual revenue!', status: 'scheduled', scheduledAt: '2025-06-12' },
  { id: '4', platform: 'facebook', content: 'New blog post: 5 tips to optimize your operations...', status: 'draft' },
]

const PLATFORM_DOT: Record<Platform, string> = {
  facebook: 'bg-blue-500', instagram: 'bg-pink-500', tiktok: 'bg-slate-700', linkedin: 'bg-blue-700',
}

export default function SocialMedia() {
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null)
  const [postContent, setPostContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [connectModal, setConnectModal] = useState<Platform | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['facebook', 'instagram'])
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePlatformClick = (p: Platform) => {
    if (!PLATFORMS.find(pl => pl.id === p)?.connected) {
      setConnectModal(p)
      return
    }
    if (activePlatform === p) return
    setActivePlatform(p)
    setPostContent(POST_TEMPLATES[p])
  }

  const togglePlatformSelect = (p: Platform) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">Connect your social accounts and create platform-optimized content</p>

      {/* Platform connection cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map(p => (
          <Card
            key={p.id}
            hover
            onClick={() => handlePlatformClick(p.id)}
            className={`border-2 ${activePlatform === p.id ? 'border-brand-500 ring-2 ring-brand-100' : 'border-transparent'}`}
          >
            <CardBody className="flex flex-col items-center gap-3 py-6">
              <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black ${p.bg} ${p.color}`}>
                {PLATFORM_ICONS[p.id]}
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 text-sm">{p.label}</p>
                {p.connected
                  ? <Badge variant="success"><CheckCircle2 size={10} className="inline mr-1" />Connected</Badge>
                  : <Badge variant="default">Connect</Badge>
                }
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Post composer */}
      {activePlatform && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${PLATFORM_DOT[activePlatform]}`} />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Create {PLATFORMS.find(p => p.id === activePlatform)?.label} Post
                </h3>
              </div>
              <p className="text-xs text-slate-500">Template pre-loaded — customize below</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Platform multi-select */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Post to:</p>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.filter(p => p.connected).map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatformSelect(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedPlatforms.includes(p.id)
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              rows={10}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none font-mono leading-relaxed"
              placeholder="Your post content..."
            />

            {/* Image upload */}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Upload preview" className="h-36 rounded-xl object-cover border border-slate-200" />
                  <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-brand-300 hover:text-brand-500 transition-colors"
                >
                  <Image size={16} /> Add photo / video
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{postContent.length} characters</span>
                {/* Character limit hints per platform */}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<Clock size={14} />}>Schedule</Button>
                <Button size="sm" icon={<Send size={14} />}>Publish Now</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent posts */}
      <Card>
        <CardHeader><h3 className="font-semibold text-slate-900 text-sm">Recent Posts</h3></CardHeader>
        <div className="divide-y divide-slate-50">
          {recentPosts.map(post => (
            <div key={post.id} className="flex items-start gap-4 px-5 py-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                post.platform === 'facebook' ? 'bg-blue-100 text-blue-700' :
                post.platform === 'instagram' ? 'bg-pink-100 text-pink-700' :
                post.platform === 'linkedin' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {PLATFORM_ICONS[post.platform]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant={post.status === 'published' ? 'success' : post.status === 'scheduled' ? 'info' : 'default'}>
                    {post.status}
                  </Badge>
                  {post.publishedAt && <span className="text-xs text-slate-400">{post.publishedAt}</span>}
                  {post.scheduledAt && <span className="text-xs text-slate-400">Scheduled: {post.scheduledAt}</span>}
                </div>
              </div>
              {post.likes !== undefined && (
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                  <span className="flex items-center gap-1"><ThumbsUp size={12} />{post.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} />{post.comments}</span>
                  <span className="flex items-center gap-1"><Share size={12} />{post.shares}</span>
                  <span className="flex items-center gap-1 text-brand-500 font-medium"><Link2 size={12} />{post.reach?.toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Connect modal */}
      <Modal open={connectModal !== null} onClose={() => setConnectModal(null)} title={`Connect ${connectModal ? PLATFORMS.find(p => p.id === connectModal)?.label : ''}`}>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Connect your account to start posting and viewing analytics directly from BizOps.</p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Access Token / API Key</label>
            <input type="password" placeholder="Paste your access token here" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Page / Account ID</label>
            <input type="text" placeholder="Your page or account ID" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setConnectModal(null)}>Connect Account</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setConnectModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
