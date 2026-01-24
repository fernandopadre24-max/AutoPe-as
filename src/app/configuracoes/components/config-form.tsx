'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/lib/data';
import type { StoreConfig, PixKeyType } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils';

const formSchema = z.object({
  storeName: z.string().min(2, { message: 'O nome da loja é obrigatório.' }),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  pixKeyType: z.enum(['email', 'cpf', 'cnpj', 'telefone', 'aleatoria']).optional(),
  pixKeyValue: z.string().optional(),
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
    </Button>
  );
}

export function ConfigForm() {
  const { toast } = useToast();
  const { config: configData, isLoading, saveConfig } = useData();



  const form = useForm<StoreConfig>({
    mode: 'onChange', // Enable real-time validation
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: '',
      cnpj: '',
      address: '',
      phone: '',
      pixKeyType: undefined,
      pixKeyValue: '',
    },
  });

  useEffect(() => {
    if (configData && configData.storeName) {
      const formData = {
        ...configData,
        phone: configData.phone ? formatPhoneNumber(configData.phone) : '',
        pixKeyType: (configData.pixKeyType || "") as any,
      };
      form.reset(formData);
    }
  }, [configData, form]);

  async function onSubmit(values: StoreConfig) {
    try {
      saveConfig({
        ...values,
        phone: values.phone?.replace(/\D/g, ''),
      });
      toast({
        title: 'Sucesso!',
        description: 'As configurações da loja foram atualizadas.',
      });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível salvar as configurações.',
        });
      }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="storeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Loja</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: AutoParts Express" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000/0001-00" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
             control={form.control}
             name="phone"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Telefone</FormLabel>
                 <FormControl>
                   <Input
                     placeholder="(00) 00000-0000"
                     {...field}
                     value={field.value || ''}
                     onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="pixKeyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Chave PIX</FormLabel>
                  <FormControl>
                    <Select key={field.value} onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de chave PIX">
                          {field.value === 'email' && 'E-mail'}
                          {field.value === 'cpf' && 'CPF'}
                          {field.value === 'cnpj' && 'CNPJ'}
                          {field.value === 'telefone' && 'Telefone'}
                          {field.value === 'aleatoria' && 'Chave Aleatória'}
                          {!field.value && 'Selecione o tipo de chave PIX'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           <FormField
             control={form.control}
             name="pixKeyValue"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Chave PIX</FormLabel>
                 <FormControl>
                   <Input
                     placeholder="Digite a chave PIX"
                     {...field}
                     value={field.value || ''}
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />
         </div>
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </Form>
  );
}
