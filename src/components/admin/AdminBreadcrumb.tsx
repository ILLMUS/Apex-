import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type AdminCrumb = {
  label: string;
  to?: string;
};

/**
 * Consistent breadcrumb shown across every admin route.
 * Always starts with Home → Admin, then optional extra crumbs.
 * The last crumb is rendered as the current page.
 */
const AdminBreadcrumb = ({ items = [] }: { items?: AdminCrumb[] }) => {
  const trail: AdminCrumb[] = [
    { label: "Home", to: "/" },
    { label: "Admin", to: "/admin" },
    ...items,
  ];

  return (
    <div className="bg-muted/50 border-b border-border px-4 sm:px-6 py-2">
      <Breadcrumb>
        <BreadcrumbList>
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <span key={`${crumb.label}-${i}`} className="contents">
                <BreadcrumbItem>
                  {isLast || !crumb.to ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3 w-3" />
                  </BreadcrumbSeparator>
                )}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default AdminBreadcrumb;
