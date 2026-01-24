'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  generateDescriptionAction,
  suggestPriceAction,
} from '@/app/produtos/actions';
import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useData } from '@/lib/data';
import { useRouter, useSearchParams } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome do produto deve ter pelo menos 2 caracteres.' }),
  categoryId: z.string().min(1, { message: 'A categoria é obrigatória.' }),
  color: z.string().min(1, { message: 'A cor é obrigatória.' }),
  size: z.string().min(1, { message: 'O tamanho é obrigatório.' }),
  gender: z.string().min(1, { message: 'O gênero é obrigatório.' }),
  supplierId: z.string().optional(),
  stock: z.string().refine((val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0, { message: 'Estoque deve ser um número não negativo.' }),
  minStock: z.string().refine((val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0, { message: 'Estoque mínimo deve ser um número não negativo.' }),
  purchasePrice: z.string().refine((val) => !isNaN(parseFloat(val)), { message: 'Preço de compra inválido.' }),
  salePrice: z.string().refine((val) => !isNaN(parseFloat(val)), { message: 'Preço de venda inválido.' }),
  description: z.string().optional(),
});

type ProdutoFormData = z.infer<typeof formSchema>;

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {pending ? <Loader2 className="animate-spin" /> : 'Salvar Produto'}
        </Button>
    )
}

export function AddProdutoForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const { addProduct, getProductById, suppliers, categories } = useData();
  
  const duplicateId = searchParams.get('duplicateId');

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      color: '',
      size: '',
      gender: '',
      supplierId: '',
      stock: '0',
      minStock: '5',
      purchasePrice: '0',
      salePrice: '0',
      description: '',
    },
  });

  useEffect(() => {
    if (duplicateId) {
      const productToDuplicate = getProductById(duplicateId);
      if (productToDuplicate) {
        form.reset({
          name: productToDuplicate.name,
          categoryId: productToDuplicate.categoryId || '',
          color: productToDuplicate.color,
          size: productToDuplicate.size,
          gender: productToDuplicate.gender,
          supplierId: productToDuplicate.supplierId,
          stock: '0', // Reset stock for new product
          minStock: String(productToDuplicate.minStock || 5),
          purchasePrice: String(productToDuplicate.purchasePrice),
          salePrice: String(productToDuplicate.salePrice),
          description: productToDuplicate.description || '',
        });
         toast({
          title: 'Produto Duplicado',
          description: `Dados de "${productToDuplicate.name}" carregados. Um novo SKU será gerado ao salvar.`,
        });
      }
    }
  }, [duplicateId, getProductById, form, toast]);
  
  async function onSubmit(values: ProdutoFormData) {
    try {
      addProduct({
        sku: `PROD-${Date.now().toString().slice(-6)}`,
        name: values.name,
        stock: Number(values.stock),
        minStock: Number(values.minStock || 5),
        purchasePrice: Number(values.purchasePrice),
        salePrice: Number(values.salePrice),
        categoryId: values.categoryId,
        supplierId: values.supplierId === 'none' ? undefined : values.supplierId,
        color: values.color,
        size: values.size,
        gender: values.gender as any,
        description: values.description || '',
      });
      toast({ title: "Sucesso!", description: "Novo produto adicionado ao catálogo." });
      router.push('/produtos');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({ variant: 'destructive', title: "Erro", description: `Erro ao criar produto: ${errorMessage}` });
    }
  }

  async function handleGenerateDescription() {
    setIsGeneratingDescription(true);
    const values = form.getValues();
    try {
        const result = await generateDescriptionAction({
            productName: values.name,
            category: values.categoryId,
            brand: 'N/A', // You may want to add a brand field
            gender: values.gender,
          color: values.color,
          material: 'N/A', // You may want to add a material field
          size: values.size,
          condition: 'new'
      });
      if (result.description) {
        form.setValue('description', result.description);
        toast({
          title: 'Descrição Gerada!',
          description: 'A descrição do produto foi gerada com sucesso.',
        });
      } else {
        throw new Error('Failed to generate description.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível gerar a descrição.',
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  async function handleSuggestPrice() {
    setIsSuggestingPrice(true);
    const values = form.getValues();
    try {
      const result = await suggestPriceAction({
        productName: values.name,
        purchasePrice: parseFloat(values.purchasePrice),
        marketData: "Forte demanda no mercado de moda casual",
        competitorPricing: "Concorrentes vendem itens similares entre R$10 a R$50 mais caro",
        inventoryLevel: parseInt(values.stock),
      });
      if (result.suggestedPrice) {
        form.setValue('salePrice', result.suggestedPrice.toString());
        toast({
          title: 'Preço Sugerido!',
          description: (
            <div>
                <p>Preço de venda atualizado para {result.suggestedPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}.</p>
                <p className="text-xs text-muted-foreground mt-2">Justificativa: {result.reasoning}</p>
            </div>
          )
        });
      } else {
        throw new Error('Failed to suggest price.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível sugerir o preço.',
      });
    } finally {
      setIsSuggestingPrice(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Produto</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Camiseta Básica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                 <FormControl>
                  <Input placeholder="Ex: Azul, Verde, Estampado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tamanho</FormLabel>
                 <FormControl>
                  <Input placeholder="Ex: P, M, G, 40, 42" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Unissex">Unissex</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de Estoque</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Mínimo</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="5" {...field} />
                </FormControl>
                <FormDescription>
                  Quantidade mínima para alerta de reposição
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Compra (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="10,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Venda (R$)</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="20,00" {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSuggestPrice}
                    disabled={isSuggestingPrice}
                    className="whitespace-nowrap"
                  >
                    {isSuggestingPrice ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Sparkles className="mr-2" />
                    )}
                    Sugerir
                  </Button>
                </div>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-8">
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center justify-between">
                    <span>Descrição do Produto</span>
                    <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDescription}
                    >
                        {isGeneratingDescription ? (
                        <Loader2 className="animate-spin mr-2" />
                        ) : (
                        <Wand2 className="mr-2" />
                        )}
                        Gerar Descrição com IA
                    </Button>
                    </FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Descrição detalhada do produto para o cliente."
                        className="resize-y min-h-[120px]"
                        {...field}
                    />
                    </FormControl>
                    <FormDescription>
                        Esta descrição será exibida na página do produto.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push('/produtos')}>Cancelar</Button>
            <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
