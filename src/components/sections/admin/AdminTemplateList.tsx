
'use client';

import type { Template } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit2, Trash2, Eye, AlertCircle, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface AdminTemplateListProps {
  templates: Template[];
  // onEditTemplate: (template: Template) => void; // Removed
  onDeleteTemplate: (templateId: string) => Promise<void>;
  isDeleting: string | null; 
}

export function AdminTemplateList({ templates, onDeleteTemplate, isDeleting }: AdminTemplateListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      await onDeleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    }
    setDialogOpen(false);
  };

  if (templates.length === 0) {
    return <p className="text-muted-foreground mt-4 text-center py-8">No templates found. Add one using the button above!</p>;
  }

  return (
    <>
      <div className="mt-8 rounded-lg border bg-card text-card-foreground"> {/* Removed shadow-sm */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Price</TableHead>
              <TableHead className="hidden xl:table-cell">Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="w-[80px] hidden sm:table-cell">
                  <Image
                    src={template.imageUrl || 'https://placehold.co/60x40.png'}
                    alt={template.title}
                    width={60}
                    height={40} 
                    className="rounded object-cover"
                    data-ai-hint={template.dataAiHint || "template icon"}
                  />
                </TableCell>
                <TableCell className="font-medium">{template.title}</TableCell>
                <TableCell className="hidden md:table-cell">{template.category.name}</TableCell>
                <TableCell className="hidden lg:table-cell">${template.price.toFixed(2)}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && <Badge variant="secondary" className="text-xs">...</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/templates/${template.id}`} target="_blank" className="flex items-center cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" /> View Public Page <ExternalLink className="ml-auto h-3 w-3"/>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/templates/edit/${template.id}`} className="flex items-center cursor-pointer">
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Template
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(template)} 
                        className="flex items-center text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        disabled={isDeleting === template.id}
                      >
                        {isDeleting === template.id ? (
                            <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template
              "{templateToDelete?.title}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting === templateToDelete?.id}
            >
              {isDeleting === templateToDelete?.id ? "Deleting..." : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
