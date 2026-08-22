import type { UserProfileData } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS, formatAdminDate } from "@/lib/constants/admin";

interface FieldProps {
  label: string;
  value?: string | null;
  empty?: string;
  /** let long values wrap instead of truncating (URLs, signatures, field lists) */
  wrap?: boolean;
}

function Field({ label, value, empty = "-", wrap = false }: FieldProps) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 border-b border-hairline py-4 first:border-t sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-5">
      <div className="type-tech text-tertiary">{label}</div>
      <div
        className={cn(
          "text-sm leading-6",
          wrap ? "break-all" : "truncate",
          !value && "text-muted-foreground",
        )}
        title={value || undefined}
      >
        {value || empty}
      </div>
    </div>
  );
}

interface UserDetailCardProps {
  user: UserProfileData;
}

const INCOMPLETE_FIELD_LABELS: Record<string, string> = {
  name: "姓名",
  phone_number: "手机号",
  qq_number: "QQ",
  major: "专业",
};

function fieldLabels(fields: string[]): string[] {
  return fields.map((f) => INCOMPLETE_FIELD_LABELS[f] ?? f);
}

export function UserDetailCard({ user }: UserDetailCardProps) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-label="基本信息">
        <h2 className="type-tech mb-3 text-tertiary">基本信息</h2>
        <Field label="ID" value={String(user.id)} />
        <Field label="姓名" value={user.name} />
        <Field label="昵称" value={user.profile?.nickname} />
        <Field label="学号" value={user.student_id} />
        <Field label="学院" value={user.college} wrap />
        <Field label="专业" value={user.major} wrap />
      </section>

      <section aria-label="身份与权限">
        <h2 className="type-tech mb-3 text-tertiary">身份与权限</h2>
        <Field label="角色" value={ROLE_LABELS[user.role] ?? user.role} />
        <Field label="状态" value={STATE_LABELS[user.state] ?? user.state} />
        <Field
          label="资料状态"
          wrap
          value={
            user.profile_needs_completion
              ? `待补全（${fieldLabels(user.incomplete_fields).join("、") || "未知字段"}）`
              : "已完整"
          }
        />
        <Field
          label="部门"
          value={
            user.profile?.department
              ? (DEPARTMENT_LABELS[user.profile.department] ?? user.profile.department)
              : null
          }
        />
      </section>

      <section aria-label="联系方式">
        <h2 className="type-tech mb-3 text-tertiary">联系方式</h2>
        <Field label="登录邮箱" value={user.login_email} />
        <Field label="手机号" value={user.phone_number} />
        <Field label="QQ" value={user.qq_number} />
        <Field label="博客" value={user.profile?.blog_url} wrap />
        <Field label="GitHub" value={user.profile?.github_url} wrap />
      </section>

      <section aria-label="其他">
        <h2 className="type-tech mb-3 text-tertiary">其他</h2>
        <Field label="签名" value={user.profile?.intro} empty="未填写" wrap />
        <Field label="注册时间" value={formatAdminDate(user.created_at)} />
        <Field label="更新时间" value={formatAdminDate(user.updated_at)} />
      </section>
    </div>
  );
}
