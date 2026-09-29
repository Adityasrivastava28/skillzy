import {
  UserCircle2, Sparkles, MessageCircle, CalendarCheck, ShieldCheck, Trophy,
  Search, Handshake, Send, Video, ArrowRight, IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MATCH_WEIGHTS } from "@/lib/match";
import { getCurrentUser } from "@/lib/auth/session";

const features = [
  { icon: UserCircle2, title: "Skill Profiles", live: true, text: "List what you can teach and what you want to learn, with your availability and goals." },
  { icon: Sparkles, title: "Smart Matching", live: true, text: "Ranked by skill fit, availability overlap, and shared goals, with the reasoning shown." },
  { icon: MessageCircle, title: "Live Chat", live: false, text: "Message, share files, and drop meeting links before a session." },
  { icon: CalendarCheck, title: "Session Booking", live: false, text: "Calendar scheduling with automatic reminders." },
  { icon: ShieldCheck, title: "Reviews & Trust", live: false, text: "Rate every exchange to build a visible trust score." },
  { icon: Trophy, title: "Gamification", live: false, text: "XP, badges, streaks, and a leaderboard keep learning fun." },
];

const steps = [
  { icon: Search, title: "Discover", live: true, text: "Create a profile with the skill you want to learn." },
  { icon: Sparkles, title: "Match", live: true, text: "See partners who want what you can teach." },
  { icon: Send, title: "Request", live: false, text: "Send an exchange request offering a skill back." },
  { icon: Handshake, title: "Accept", live: false, text: "Your partner accepts and you book a first session." },
  { icon: Video, title: "Exchange", live: false, text: "Trade short sessions and feedback." },
  { icon: Trophy, title: "Grow", live: false, text: "Rate each other, earn XP, keep your streak." },
];

const audiences = [
  { tag: "Primary", items: ["College students", "Fresh graduates", "Hobby learners"] },
  { tag: "Secondary", items: ["Freelancers", "Working professionals"] },
  { tag: "Coming later", items: ["Universities", "Companies", "NGOs"] },
];

const scoring = [
  { label: "Skill fit", weight: MATCH_WEIGHTS.skillFit, text: "You can teach what they want, and they can teach what you want." },
  { label: "Availability", weight: MATCH_WEIGHTS.availability, text: "How much of your free time slots overlap." },
  { label: "Shared goals", weight: MATCH_WEIGHTS.goals, text: "Portfolio, hackathon, placements: are you after the same thing?" },
];

function Status({ live }: { live: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-muted"}`}
    >
      {live ? "Live" : "Coming soon"}
    </span>
  );
}

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-16 md:grid-cols-2 md:pt-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
            <IndianRupee size={12} aria-hidden /> No fees: skills are traded, not bought
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] md:text-5xl">
            Learn by teaching.
            <br />
            <span className="text-primary">Teach by learning.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            SkillSwap matches you with someone who has the skill you want and wants the skill you have.
            No fees, no hierarchy: both people teach, both people learn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Button href="/dashboard">Go to your dashboard <ArrowRight size={16} aria-hidden /></Button>
            ) : (
              <>
                <Button href="/signup">Start swapping <ArrowRight size={16} aria-hidden /></Button>
                <Button variant="outline" href="/login">Log in</Button>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-100 via-white to-emerald-100 blur-2xl" aria-hidden />
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold">How your match score is calculated</h2>
              <p className="mt-1 text-sm text-muted">No black box. Every match shows exactly why it scored what it did.</p>
            </div>
            {scoring.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-muted">{Math.round(s.weight * 100)}% of the score</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${s.weight * 100}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">{s.text}</p>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-center text-3xl font-semibold">Learning today is one-directional</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            ["Expensive subscriptions", "Paid courses and 1:1 tutoring price out students and hobby learners."],
            ["One-way learning", "Platforms push content at learners; nobody gets to teach back."],
            ["No barter system", "There is no dedicated space to trade skills instead of money."],
            ["Hard to find mentors", "Discovering trustworthy, relevant mentors is slow and random."],
          ].map(([t, d]) => (
            <Card key={t}>
              <h3 className="text-base font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-semibold">How a swap works</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted">
          We&apos;re building this in the open. What&apos;s live is marked; the rest is on its way.
        </p>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                      <s.icon size={20} aria-hidden />
                    </span>
                    <span className="text-xs font-semibold text-muted">STEP {i + 1}</span>
                  </div>
                  <Status live={s.live} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-semibold">Everything you need to swap</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-secondary">
                  <f.icon size={22} aria-hidden />
                </span>
                <Status live={f.live} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-semibold">Built for people with skills to give</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {audiences.map((a) => (
            <Card key={a.tag}>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{a.tag}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {a.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="rounded-3xl bg-primary px-8 py-14 text-center text-white shadow-lift">
            <h2 className="text-3xl font-semibold">You already have a skill someone wants.</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">Trade it for one you need. Takes two minutes to set up.</p>
            <Button href="/signup" variant="secondary" className="mt-7">Create your profile</Button>
          </div>
        </section>
      )}
    </>
  );
}
