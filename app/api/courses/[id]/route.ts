import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Fiches et quiz déjà générés pour un cours.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { data, error } = await supabase
    .from("outputs")
    .select("id, kind, topic, options, body, created_at")
    .eq("course_id", params.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "Impossible de charger ce cours." }, { status: 500 });
  return NextResponse.json({ outputs: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const { error } = await supabase.from("courses").delete().eq("id", params.id).eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "Suppression impossible." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
