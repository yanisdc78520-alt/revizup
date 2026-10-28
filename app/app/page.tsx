import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { LIMITS, quizLimit } from "@/lib/plans";
import Workspace from "@/components/Workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes cours · RevizUp" };

export default async function AppPage({ searchParams }: { searchParams: { pro?: string } }) {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user || !profile) redirect("/connexion");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, source, topics, created_at, content")
    .order("created_at", { ascending: false });

  const list = (courses ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string,
    source: (c.source as string) ?? "",
    topics: (Array.isArray(c.topics) ? c.topics : []) as string[],
    chars: (c.content as string).length,
  }));

  return (
    <Workspace
      email={user.email ?? ""}
      plan={profile.plan}
      used={profile.generations_used}
      freeLimit={LIMITS.free.generations}
      maxQuiz={quizLimit(profile.plan)}
      initialCourses={list}
      justUpgraded={searchParams.pro === "ok"}
    />
  );
}
