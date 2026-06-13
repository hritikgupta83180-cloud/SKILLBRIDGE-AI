import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { API } from '../context/AuthContext'
import { Send, Brain, User, Zap, Mic, MicOff, Volume2, VolumeX, StopCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const SUGGESTIONS = [
  "What should I learn next?",
  "Can I get a job in 6 months?",
  "Suggest projects for my roadmap",
  "How to improve my ATS score?",
  "Which skills are most important?",
  "How to prepare for interviews?"
]

export default function MentorPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI Career Mentor 🧠 I've analyzed your resume and roadmap. Ask me anything about your career journey, skills to learn, or interview prep!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisId, setAnalysisId] = useState(null)
  const bottomRef = useRef()

  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef(null)

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null)
  const utteranceRef = useRef(null)

  useEffect(() => {
    axios.get(`${API}/dashboard`).then(r => setAnalysisId(r.data.latest_analysis_id))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('')
        setInput(transcript)
      }
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)
      recognitionRef.current = recognition
    }
    return () => {
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
      setSpeakingMsgIdx(null)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  const speak = useCallback((text, msgIdx) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const clean = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^\s*[-•]\s/gm, '')
      .replace(/\n+/g, '. ')
      .trim()
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    if (preferred) utterance.voice = preferred
    utterance.onstart = () => { setIsSpeaking(true); setSpeakingMsgIdx(msgIdx) }
    utterance.onend = () => { setIsSpeaking(false); setSpeakingMsgIdx(null) }
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgIdx(null) }
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    setSpeakingMsgIdx(null)
  }, [])

  const send = async (question) => {
    const q = question || input.trim()
    if (!q) return
    setInput('')
    stopSpeaking()
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const r = await axios.post(`${API}/mentor/chat`, { question: q, analysis_id: analysisId })
      const answer = r.data.answer
      setMessages(m => {
        const newMessages = [...m, { role: 'ai', text: answer }]
        if (voiceEnabled) setTimeout(() => speak(answer, newMessages.length - 1), 100)
        return newMessages
      })
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: 'Sorry, I had trouble connecting. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={24} color="var(--accent)" /> AI Career Mentor
          </h1>
          <p style={{ color: 'var(--muted)' }}>Ask me anything about your career path, skills, or interview prep</p>
        </div>
        <button
          onClick={() => { voiceEnabled ? stopSpeaking() : null; setVoiceEnabled(v => !v) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 20,
            background: voiceEnabled ? 'rgba(99,102,241,0.15)' : 'var(--surface2)',
            border: `1px solid ${voiceEnabled ? 'var(--accent)' : 'var(--border)'}`,
            color: voiceEnabled ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
          }}>
          {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {voiceEnabled ? 'Voice On' : 'Voice Off'}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'ai' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                <Brain size={16} color="white" />
              </div>
            )}
            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'var(--surface)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                fontSize: 14, lineHeight: 1.7, color: 'var(--text)'
              }}>
                {m.role === 'user' ? <span>{m.text}</span> : (
                  <div className="markdown-body"><ReactMarkdown>{m.text}</ReactMarkdown></div>
                )}
              </div>
              {m.role === 'ai' && (
                <button
                  onClick={() => speakingMsgIdx === i ? stopSpeaking() : speak(m.text, i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 12,
                    background: speakingMsgIdx === i ? 'rgba(99,102,241,0.2)' : 'transparent',
                    border: `1px solid ${speakingMsgIdx === i ? 'var(--accent)' : 'var(--border)'}`,
                    color: speakingMsgIdx === i ? 'var(--accent)' : 'var(--muted)',
                    cursor: 'pointer', fontSize: 11, transition: 'all 0.2s'
                  }}>
                  {speakingMsgIdx === i ? <><StopCircle size={11} /> Stop</> : <><Volume2 size={11} /> Listen</>}
                </button>
              )}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4, border: '1px solid var(--border)' }}>
                <User size={16} color="var(--muted)" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={16} color="white" />
            </div>
            <div style={{ padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {SUGGESTIONS.slice(0, 3).map(s => (
          <button key={s} onClick={() => send(s)}
            style={{ padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--muted2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <Zap size={11} color="var(--accent)" />{s}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {voiceSupported && (
          <button
            onClick={toggleListening}
            disabled={loading}
            style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isListening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'var(--surface2)',
              border: `1px solid ${isListening ? '#ef4444' : 'var(--border)'}`,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none',
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none'
            }}>
            {isListening ? <MicOff size={18} color="white" /> : <Mic size={18} color="var(--muted)" />}
          </button>
        )}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && send()}
          placeholder={isListening ? '🎤 Listening...' : 'Ask your AI mentor anything...'}
          style={{ flex: 1, borderColor: isListening ? 'rgba(239,68,68,0.5)' : undefined, transition: 'border-color 0.2s' }}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim() || loading} style={{ padding: '12px 18px' }}>
          <Send size={16} />
        </button>
      </div>

      {isListening && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s ease-in-out infinite' }} />
          Listening... speak your question, then press Enter or Send
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .markdown-body h1, .markdown-body h2 { font-size: 15px; font-weight: 700; color: var(--text); margin: 12px 0 6px 0; font-family: 'Space Grotesk', sans-serif; }
        .markdown-body h3 { font-size: 14px; font-weight: 600; color: var(--text); margin: 10px 0 4px 0; }
        .markdown-body p { margin: 4px 0; color: var(--text); line-height: 1.7; }
        .markdown-body ul, .markdown-body ol { padding-left: 18px; margin: 6px 0; }
        .markdown-body li { margin: 4px 0; color: var(--text); line-height: 1.6; }
        .markdown-body strong { color: #a5b4fc; font-weight: 600; }
        .markdown-body em { color: var(--muted2); font-style: italic; }
        .markdown-body blockquote { border-left: 3px solid var(--accent); padding: 6px 12px; margin: 10px 0; background: rgba(99,102,241,0.08); border-radius: 0 8px 8px 0; color: #a5b4fc; font-style: italic; }
        .markdown-body code { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-size: 12px; color: var(--accent3); }
        .markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
      `}</style>
    </div>
  )
}