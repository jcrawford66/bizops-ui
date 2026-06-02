import { useState, useRef } from 'react'
import { Image, Send, Clock, ThumbsUp, MessageCircle, Share, Link2, CheckCircle2, Unlink } from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import type { SocialPost } from '../types'

type Platform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin'

type PlatformConfig = {
  id: Platform
  label: string
  color: string
  bg: string
  helpText: string
  tokenLabel: string
  tokenPlaceholder: string
  accountLabel: string
  accountPlaceholder: string
  docsUrl: string
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10 border-blue-500/30',
    helpText: 'You\'ll need a Facebook Page Access Token. Go to Facebook Developers → your App → Graph API Explorer, select your page, and generate a Page Access Token with pages_manage_posts and pages_read_engagement permissions.',
    tokenLabel: 'Page Access Token',
    tokenPlaceholder: 'EAABsbCS...',
    accountLabel: 'Facebook Page ID',
    accountPlaceholder: '1234567890',
    docsUrl: 'https://developers.facebook.com/docs/pages/access-tokens',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: 'text-pink-600',
    bg: 'bg-pink-500/10 border-pink-500/30',
    helpText: 'Instagram requires a Facebook-linked Business or Creator account. You\'ll need an Instagram User Access Token via the Facebook Graph API with instagram_basic and instagram_content_publish permissions.',
    tokenLabel: 'Instagram Access Token',
    tokenPlaceholder: 'IGQVJXb3...',
    accountLabel: 'Instagram Business Account ID',
    accountPlaceholder: '17841400...',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: 'text-white',
    bg: 'bg-slate-700/30 border-slate-700',
    helpText: 'You\'ll need a TikTok for Business account and access to the TikTok Content Posting API. Generate an access token from the TikTok Developer Portal.',
    tokenLabel: 'TikTok Access Token',
    tokenPlaceholder: 'act.example...',
    accountLabel: 'TikTok Open ID',
    accountPlaceholder: 'Your TikTok Open ID',
    docsUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: 'text-blue-700',
    bg: 'bg-sky-50 border-sky-200',
    helpText: 'Create a LinkedIn App and request the Share on LinkedIn and Sign In with LinkedIn using OpenID Connect products. Generate a token with w_member_social permission.',
    tokenLabel: 'LinkedIn Access Token',
    tokenPlaceholder: 'AQV...',
    accountLabel: 'LinkedIn Person URN',
    accountPlaceholder: 'urn:li:person:xxxxxxxx',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api',
  },
]

const PLATFORM_ICONS: Record<Platform, string> = {
  facebook: 'f', instagram: '📷', tiktok: '♪', linkedin: 'in',
}

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

const PLATFORM_DOT: Record<Platform, string> = {
  facebook: 'bg-blue-500', instagram: 'bg-pink-500', tiktok: 'bg-slate-700', linkedin: 'bg-blue-700',
}

const recentPosts: SocialPost[] = [
  { id: '1', platform: 'facebook', content: 'Summer sale is here! 20% off all services this week only...', status: 'published', publishedAt: '2025-06-01', likes: 84, comments: 12, shares: 21, reach: 1420 },
  { id: '2', platform: 'instagram', content: 'Behind the scenes of our team at work ✨', status: 'published', publishedAt: '2025-05-30', likes: 213, comments: 34, shares: 8, reach: 3100 },
  { id: '3', platform: 'linkedin', content: 'Proud to announce we crossed $1M in annual revenue!', status: 'scheduled', scheduledAt: '2025-06-12' },
  { id: '4', platform: 'facebook', content: 'New blog post: 5 tips to optimize your operations...', status: 'draft' },
]

type ConnectionState = { token: string; accountId: string }

export default function SocialMedia() {
  // All platforms start disconnected — user must connect explicitly
  const [connections, setConnections] = useState<Partial<Record<Platform, ConnectionState>>>({})
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null)
  const [postContent, setPostContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [connectModal, setConnectModal] = useState<Platform | null>(null)
  const [disconnectConfirm, setDisconnectConfirm] = useState<Platform | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [formToken, setFormToken] = useState('')
  const [formAccountId, setFormAccountId] = useState('')
  const [formError, setFormError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const isConnected = (p: Platform) => !!connections[p]
  const connectedPlatforms = PLATFORM_CONFIGS.filter(p => isConnected(p.id))

  const openConnectModal = (p: Platform) => {
    setFormToken('')
    setFormAccountId('')
    setFormError('')
    setConnectModal(p)
  }

  const handlePlatformClick = (p: Platform) => {
    if (!isConnected(p)) {
      openConnectModal(p)
      return
    }
    if (activePlatform === p) return
    setActivePlatform(p)
    setPostContent(POST_TEMPLATES[p])
    if (!selectedPlatforms.includes(p)) setSelectedPlatforms([p])
  }

  const handleConnect = () => {
    if (!formToken.trim()) { setFormError('Access token is required.'); return }
    if (!formAccountId.trim()) { setFormError('Account / Page ID is required.'); return }
    setConnections(prev => ({ ...prev, [connectModal!]: { token: formToken.trim(), accountId: formAccountId.trim() } }))
    setConnectModal(null)
    // Auto-open composer for the newly connected platform
    setActivePlatform(connectModal!)
    setPostContent(POST_TEMPLATES[connectModal!])
    setSelectedPlatforms(prev => prev.includes(connectModal!) ? prev : [...prev, connectModal!])
  }

  const handleDisconnect = (p: Platform) => {
    setConnections(prev => { const next = { ...prev }; delete next[p]; return next })
    if (activePlatform === p) setActivePlatform(null)
    setSelectedPlatforms(prev => prev.filter(x => x !== p))
    setDisconnectConfirm(null)
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

  const modalConfig = connectModal ? PLATFORM_CONFIGS.find(p => p.id === connectModal)! : null

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">Connect your social accounts and create platform-optimized content</p>

      {/* Platform cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORM_CONFIGS.map(p => {
          const connected = isConnected(p.id)
          return (
            <Card
              key={p.id}
              hover
              onClick={() => handlePlatformClick(p.id)}
              className={`border-2 ${activePlatform === p.id ? 'border-brand-500 ring-2 ring-sky-100' : 'border-transparent'}`}
            >
              <CardBody className="flex flex-col items-center gap-3 py-6 relative">
                {/* Disconnect button (top-right, only when connected) */}
                {connected && (
                  <button
                    onClick={e => { e.stopPropagation(); setDisconnectConfirm(p.id) }}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-400 transition-colors"
                    title="Disconnect"
                  >
                    <Unlink size={13} />
                  </button>
                )}
                <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black ${p.bg} ${p.color}`}>
                  {PLATFORM_ICONS[p.id]}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white text-sm">{p.label}</p>
                  {connected
                    ? <Badge variant="success"><CheckCircle2 size={10} className="inline mr-1" />Connected</Badge>
                    : <Badge variant="default">Connect</Badge>
                  }
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* No connections prompt */}
      {connectedPlatforms.length === 0 && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-5 text-center">
          <p className="text-sm font-medium text-sky-400">No accounts connected yet</p>
          <p className="text-xs text-sky-400 mt-1">Click any platform card above to connect your account and start posting.</p>
        </div>
      )}

      {/* Post composer */}
      {activePlatform && isConnected(activePlatform) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${PLATFORM_DOT[activePlatform]}`} />
                <h3 className="font-semibold text-white text-sm">
                  Create {PLATFORM_CONFIGS.find(p => p.id === activePlatform)?.label} Post
                </h3>
              </div>
              <p className="text-xs text-slate-500">Template pre-loaded — customize below</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {connectedPlatforms.length > 1 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Post to:</p>
                <div className="flex gap-2 flex-wrap">
                  {connectedPlatforms.map(p => (
                    <button
                      key={p.id}
                      onClick={() => togglePlatformSelect(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedPlatforms.includes(p.id)
                          ? 'bg-sky-500 text-white border-brand-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-brand-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              rows={10}
              className="w-full border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500 resize-none font-mono leading-relaxed"
              placeholder="Your post content..."
            />

            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Upload preview" className="h-36 rounded-xl object-cover border border-slate-700" />
                  <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-700 rounded-xl text-sm text-slate-500 hover:border-brand-300 hover:text-sky-400 transition-colors"
                >
                  <Image size={16} /> Add photo / video
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{postContent.length} characters</span>
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
        <CardHeader><h3 className="font-semibold text-white text-sm">Recent Posts</h3></CardHeader>
        <div className="divide-y divide-slate-700/60">
          {recentPosts.map(post => (
            <div key={post.id} className="flex items-start gap-4 px-5 py-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
                post.platform === 'facebook' ? 'bg-blue-500/15 text-blue-400' :
                post.platform === 'instagram' ? 'bg-pink-500/15 text-pink-400' :
                post.platform === 'linkedin' ? 'bg-sky-500/15 text-sky-400' : 'bg-slate-700 text-slate-300'
              }`}>
                {PLATFORM_ICONS[post.platform]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 line-clamp-2">{post.content}</p>
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
                  <span className="flex items-center gap-1 text-sky-400 font-medium"><Link2 size={12} />{post.reach?.toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Connect modal */}
      {modalConfig && (
        <Modal open={connectModal !== null} onClose={() => setConnectModal(null)} title={`Connect ${modalConfig.label}`} size="md">
          <div className="p-6 space-y-5">
            {/* Platform branding */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${modalConfig.bg}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-black ${modalConfig.bg} ${modalConfig.color}`}>
                {PLATFORM_ICONS[modalConfig.id]}
              </div>
              <div>
                <p className={`font-bold text-sm ${modalConfig.color}`}>{modalConfig.label}</p>
                <a href={modalConfig.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline" onClick={e => e.stopPropagation()}>
                  View API docs ↗
                </a>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-700/30 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
              {modalConfig.helpText}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{modalConfig.tokenLabel} <span className="text-red-400">*</span></label>
              <input
                type="password"
                value={formToken}
                onChange={e => { setFormToken(e.target.value); setFormError('') }}
                placeholder={modalConfig.tokenPlaceholder}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{modalConfig.accountLabel} <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formAccountId}
                onChange={e => { setFormAccountId(e.target.value); setFormError('') }}
                placeholder={modalConfig.accountPlaceholder}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500"
              />
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <p className="text-xs text-slate-400">Your credentials are stored locally and never shared.</p>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleConnect}>Connect {modalConfig.label}</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setConnectModal(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Disconnect confirm modal */}
      <Modal open={disconnectConfirm !== null} onClose={() => setDisconnectConfirm(null)} title="Disconnect Account" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Are you sure you want to disconnect <span className="font-semibold">{disconnectConfirm ? PLATFORM_CONFIGS.find(p => p.id === disconnectConfirm)?.label : ''}</span>? Your saved credentials will be removed.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={() => handleDisconnect(disconnectConfirm!)}>Disconnect</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setDisconnectConfirm(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
