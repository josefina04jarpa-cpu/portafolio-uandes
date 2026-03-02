import { redirect } from "next/navigation";

type Params = { params: { id: string } | Promise<{ id: string }> };

export default async function Page({ params }: Params) {
  const { id } = await params;
  redirect(`/portafolio/tecnologias/${encodeURIComponent(id)}`);
}
