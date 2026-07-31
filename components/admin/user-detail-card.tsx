import type { UserProfileData } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, STATE_LABELS } from "@/lib/constants/profile";
import { DEPARTMENT_LABELS, formatAdminDate } from "@/lib/constants/admin";

interface FieldProps {
  label: string;
  value?: string | null;
  empty?: string;
}

function Field({ label, value, empty = "-" }: FieldProps) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-5 border-b border-hairline py-4 first:border-t">
      <div className="type-tech text-tertiary">{label}</div>
      <div className={cn("truncate text-sm leading-6", !value && "text-muted-foreground")}>
        {value || empty}
      </div>
    </div>
  );
}

interface UserDetailCardProps {
  user: UserProfileData;
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
        <Field label="学院" value={user.college} />
        <Field label="专业" value={user.major} />
      </section>

      <section aria-label="身份与权限">
        <h2 className="type-tech mb-3 text-tertiary">身份与权限</h2>
        <Field label="角色" value={ROLE_LABELS[user.role] ?? user.role} />
        <Field label="状态" value={STATE_LABELS[user.state] ?? user.state} />
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
        <Field label="博客" value={user.profile?.blog_url} />
        <Field label="GitHub" value={user.profile?.github_url} />
      </section>

      <section aria-label="其他">
        <h2 className="type-tech mb-3 text-tertiary">其他</h2>
        <Field label="签名" value={user.profile?.intro} empty="未填写" />
        <Field label="注册时间" value={formatAdminDate(user.created_at)} />
        <Field label="更新时间" value={formatAdminDate(user.updated_at)} />
      </section>
    </div>
  );
}
