import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EditFuncionarioForm } from './components/edit-funcionario-form';

export default async function EditFuncionarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Editar Funcionário" />
      <Card>
        <CardContent className="pt-6">
          <EditFuncionarioForm employeeId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
