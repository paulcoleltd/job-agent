import ApplicationBuilderPage from "@/features/builder/ApplicationBuilderPage";

export default function BuilderPage({ params }: { params: { id: string } }) {
  return <ApplicationBuilderPage applicationId={params.id} />;
}
