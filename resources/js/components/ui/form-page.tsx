import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@inertiajs/react";
import { ArrowLeft, Save, Loader2, LucideIcon } from "lucide-react";

interface FormPageProps {
    title: string;
    description?: string;
    backUrl: string;
    backLabel?: string;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel?: string;
    submitIcon?: LucideIcon;
    isLoading?: boolean;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function FormPage({
    title,
    description,
    backUrl,
    backLabel = "Kembali",
    onSubmit,
    submitLabel = "Simpan",
    submitIcon: SubmitIcon = Save,
    isLoading = false,
    children,
    actions,
    className,
}: FormPageProps) {
    return (
        <Card className={cn("w-full h-[calc(100vh-7rem)] flex flex-col", className)}>
            <CardHeader className="bg-muted/40 border-b flex-shrink-0">
                <div className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{title}</CardTitle>
                        {description && (
                            <CardDescription>{description}</CardDescription>
                        )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={backUrl}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {backLabel}
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <form onSubmit={onSubmit} className="flex flex-col h-full">
                    <ScrollArea className="flex-1">
                        <div className="space-y-6 p-6">
                            {children}
                        </div>
                    </ScrollArea>
                    
                    {/* Form Actions - Fixed at bottom */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20 flex-shrink-0">
                        {actions}
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <SubmitIcon className="h-4 w-4 mr-2" />
                            )}
                            {isLoading ? 'Menyimpan...' : submitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

interface DetailPageProps {
    title: string;
    description?: string;
    backUrl: string;
    backLabel?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function DetailPage({
    title,
    description,
    backUrl,
    backLabel = "Kembali",
    actions,
    children,
    className,
}: DetailPageProps) {
    return (
        <Card className={cn("w-full h-[calc(100vh-7rem)] flex flex-col", className)}>
            <CardHeader className="bg-muted/40 border-b flex-shrink-0">
                <div className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{title}</CardTitle>
                        {description && (
                            <CardDescription>{description}</CardDescription>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {actions}
                        <Button variant="outline" size="sm" asChild>
                            <Link href={backUrl}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {backLabel}
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        {children}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
