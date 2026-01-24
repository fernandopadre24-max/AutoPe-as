import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EditClienteForm } from './components/edit-cliente-form';

export default async function EditClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Editar Cliente" />
      <Card>
        <CardContent className="pt-6">
          <EditClienteForm customerId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
