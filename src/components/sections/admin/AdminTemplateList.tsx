'use client';

import type { Template } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit2, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';

interface AdminTemplateListProps {
  templates: Template[];
  onDeleteTemplate: (templateId: string) => void; // Placeholder for delete functionality
}

export function AdminTemplateList({ templates, onDeleteTemplate }: AdminTemplateListProps) {
  if (templates.length === 0) {
    return <p className="text-muted-foreground mt-4">No templates uploaded yet.</p>;
  }

  return (
    <div className="mt-8 rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>
                <Image
                  src={template.imageUrl}
                  alt={template.title}
                  width={50}
                  height={33} // Approx 3:2 aspect ratio
                  className="rounded object-cover"
                  data-ai-hint={template.dataAiHint || "template icon"}
                />
              </TableCell>
              <TableCell className="font-medium">{template.title}</TableCell>
              <TableCell>{template.category.name}</TableCell>
              <TableCell>${template.price.toFixed(2)}</TableCell>
              <TableCell>
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
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                       <Link href={`/templates/${template.id}`} className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => alert(`Editing ${template.title} (not implemented)`)} className="flex items-center">
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteTemplate(template.id)} className="flex items-center text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
