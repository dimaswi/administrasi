import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Meeting } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';
import { ArrowLeft, FileDown, Save } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Props {
    meeting: Meeting;
}

export default function MemoEditor({ meeting }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Rapat', href: '/meeting/meetings' },
        { title: meeting.title, href: `/meeting/meetings/${meeting.id}` },
        { title: 'Edit Memo', href: `/meeting/meetings/${meeting.id}/memo` },
    ];

    const [memoContent, setMemoContent] = useState(meeting.memo_content || '');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.put(
            `/meeting/meetings/${meeting.id}/memo`,
            {
                memo_content: memoContent,
            },
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleDownloadMemo = () => {
        window.open(`/meeting/meetings/${meeting.id}/generate-memo`, '_blank');
    };

    const meetingDate = new Date(meeting.meeting_date);
    const formattedDate = format(meetingDate, 'EEEE, dd MMMM yyyy', { locale: indonesianLocale });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Memo - ${meeting.title}`} />

            <div className="max-w-7xl p-4">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-semibold">Edit Memo</h2>
                        <p className="text-xs md:text-sm text-muted-foreground">Edit konten memo untuk rapat ini</p>
                    </div>
                    <Button variant="outline" onClick={() => router.visit(`/meeting/meetings/${meeting.id}`)} className="w-full sm:w-auto">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                </div>

                {/* Meeting Info */}
                <Card className='mb-6'>
                    <CardHeader>
                        <CardTitle className="text-lg md:text-xl">Informasi Rapat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">No. Rapat</p>
                                <p className="font-medium text-sm md:text-base">{meeting.meeting_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Judul</p>
                                <p className="font-medium text-sm md:text-base">{meeting.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tanggal</p>
                                <p className="font-medium text-sm md:text-base">{formattedDate}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Waktu</p>
                                <p className="font-medium text-sm md:text-base">
                                    {meeting.start_time} - {meeting.end_time} WIB
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Memo Editor */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg md:text-xl">Konten Memo</CardTitle>
                            <CardDescription>
                                Gunakan editor di bawah untuk membuat konten memo rapat. Anda dapat memformat teks, menambahkan list, dan mengatur
                                alignment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RichTextEditor
                                value={memoContent}
                                onChange={setMemoContent}
                                placeholder="Tulis konten memo di sini..."
                                className="min-h-[400px]"
                            />

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
                                <div>
                                    {meeting.memo_content && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={handleDownloadMemo} 
                                            className="w-full sm:w-auto"
                                            disabled={meeting.status !== 'completed'}
                                            title={meeting.status !== 'completed' ? 'Memo hanya dapat didownload setelah rapat selesai' : 'Download memo sebagai PDF'}
                                        >
                                            <FileDown className="mr-2 h-4 w-4" />
                                            Download PDF
                                            {meeting.status !== 'completed' && <span className="ml-2 text-xs">(Setelah Selesai)</span>}
                                        </Button>
                                    )}
                                </div>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Memo'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
