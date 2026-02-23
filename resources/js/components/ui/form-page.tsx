import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
        <div className={cn("w-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between py-4 mb-4">
                <div className="space-y-0.5">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={backUrl}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {backLabel}
                    </Link>
                </Button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="space-y-6">
                    {children}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 py-4 border-t">
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
        <div className={cn("w-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between py-4 mb-4">
                <div className="space-y-0.5">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
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

            <div>
                {children}
            </div>
        </div>
    );
}
