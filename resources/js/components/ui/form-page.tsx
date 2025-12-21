import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="p-6">
            <Card className={cn("w-full", className)}>
                <CardHeader className="bg-muted/40 border-b">
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
                <CardContent className="pt-6">
                    <form onSubmit={onSubmit} className="space-y-6">
                        {children}
                        
                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
        </div>
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
        <div className="p-6">
            <Card className={cn("w-full", className)}>
                <CardHeader className="bg-muted/40 border-b">
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
                <CardContent className="pt-6">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
