import { Badge, Card, CardBody, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/admin/tabs";
import { CommentThread } from "./comment-thread";
import { fmtDate } from "@/lib/domain/format";
import type { Dict } from "@/lib/i18n";
import type { PortalContent } from "@/lib/services/portal-content";
import type { Comment } from "@/lib/services/comments";

export type AnnouncementWithComments = PortalContent["announcements"][number] & { comments: Comment[] };

export function ContentView({
  content,
  announcements,
  role,
  commentPath,
  t,
}: {
  content: PortalContent;
  announcements: AnnouncementWithComments[];
  role: "parent" | "student";
  commentPath: string;
  t: Dict;
}) {
  const lockedNote = content.contentLocked ? t.previewOnly : undefined;

  return (
    <Tabs
      tabs={[
        {
          key: "pengumuman",
          label: t.tabAnnouncements,
          node: (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <EmptyState title={t.noAnnouncements} />
              ) : (
                announcements.map((a) => (
                  <Card key={a.id}>
                    <CardBody>
                      <h3 className="font-semibold text-ink">{a.title}</h3>
                      <p className="text-xs text-ink-soft">{fmtDate(a.created_at)}</p>
                      {a.body && <p className="mt-2 whitespace-pre-line text-sm text-ink">{a.body}</p>}
                      <CommentThread announcementId={a.id} comments={a.comments} role={role} path={commentPath} />
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          ),
        },
        {
          key: "bahan",
          label: t.tabMaterials,
          node: <FileList items={content.materials} lockedNote={lockedNote} emptyLabel={t.noMaterials} linkLabel={t.open} lockedLabel={t.locked} />,
        },
        {
          key: "rakaman",
          label: t.tabRecordings,
          node: <FileList items={content.recordings} lockedNote={lockedNote} emptyLabel={t.noRecordings} linkLabel={t.watch} lockedLabel={t.locked} />,
        },
        {
          key: "zoom",
          label: t.tabZoom,
          node: (
            <div className="space-y-3">
              {content.zoom.length === 0 ? (
                <EmptyState title={t.noZoom} />
              ) : (
                content.zoom.map((z) => (
                  <Card key={z.tingkatan}>
                    <CardBody className="flex items-center justify-between">
                      <span className="font-medium text-ink">Zoom {z.tingkatan}</span>
                      {content.liveLocked || !z.url ? (
                        <Badge className="bg-[#e4e6ec] text-[#46506a] border-[#cfd4de]">
                          {content.status === "Tamat" ? t.renewToJoin : t.notAvailable}
                        </Badge>
                      ) : (
                        <a
                          href={z.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-[5px] bg-ink px-3 py-1.5 text-sm font-medium text-paper hover:bg-ink/90"
                        >
                          {t.joinZoom}
                        </a>
                      )}
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          ),
        },
        { key: "bank", label: t.tabBank, node: <BankSoalan bank={content.bankSoalan} t={t} /> },
        {
          key: "laporan",
          label: t.tabReports,
          node: (
            <div className="space-y-2">
              {content.reports.length === 0 ? (
                <EmptyState title={t.noReports} />
              ) : (
                content.reports.map((r) => (
                  <Card key={r.id}>
                    <CardBody>
                      <p className="font-medium text-ink">
                        {r.tingkatan} · {r.bulan}
                      </p>
                      {r.guru && (
                        <p className="text-xs text-ink-soft">
                          {t.teacher}: {r.guru}
                        </p>
                      )}
                      {r.ringkasan && <p className="mt-1 text-sm text-ink">{r.ringkasan}</p>}
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          ),
        },
      ]}
    />
  );
}

function FileList({
  items,
  lockedNote,
  emptyLabel,
  linkLabel,
  lockedLabel,
}: {
  items: { id: string; title: string; url: string | null }[];
  lockedNote?: string;
  emptyLabel: string;
  linkLabel: string;
  lockedLabel: string;
}) {
  if (items.length === 0) return <EmptyState title={emptyLabel} />;
  return (
    <div className="space-y-2">
      {lockedNote && <p className="rounded-[5px] bg-highlight/25 px-3 py-2 text-sm text-ink">{lockedNote}</p>}
      {items.map((it) => (
        <Card key={it.id}>
          <CardBody className="flex items-center justify-between">
            <span className="text-sm text-ink">{it.title}</span>
            {it.url ? (
              <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-ink hover:underline">
                {linkLabel}
              </a>
            ) : (
              <Badge className="bg-[#e4e6ec] text-[#46506a] border-[#cfd4de]">{lockedLabel}</Badge>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function BankSoalan({ bank, t }: { bank: PortalContent["bankSoalan"]; t: Dict }) {
  if (!bank.access) {
    return bank.reason === "package" ? (
      <EmptyState title={t.bankUpsellTitle} description={t.bankUpsellDesc} />
    ) : (
      <EmptyState title={t.bankLocked} description={t.bankLockedDesc} />
    );
  }
  if (bank.folders.length === 0) return <EmptyState title={t.emptyFolder} />;
  return (
    <div className="space-y-3">
      {bank.folders.map((f) => {
        const files = bank.files.filter((x) => x.folder_id === f.id);
        return (
          <Card key={f.id}>
            <CardBody>
              <p className="font-semibold text-ink">
                {f.tingkatan} · {f.name}
              </p>
              {files.length === 0 ? (
                <p className="mt-1 text-sm text-ink-soft">{t.emptyFolder}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {files.map((file) => (
                    <li key={file.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{file.title}</span>
                      {file.url ? (
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:underline">
                          {t.open}
                        </a>
                      ) : (
                        <span className="text-xs text-ink-soft">—</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
