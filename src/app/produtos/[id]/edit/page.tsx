import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EditProdutoForm } from './components/edit-produto-form';

export default async function EditProdutoPage({ params }: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Editar Produto" />
      <Card>
        <CardContent className="pt-6">
          <EditProdutoForm productId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
