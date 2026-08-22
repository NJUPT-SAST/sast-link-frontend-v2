import type { Metadata } from "next";
import Link from "next/link";

import {
  LEGAL_AUDIT_LOG_RETENTION,
  LEGAL_CONTACT_EMAIL,
  LEGAL_DELETED_ACCOUNT_RETENTION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_HOSTING_REGION,
  LEGAL_OPERATOR,
  LEGAL_RESPONSE_DAYS,
  LEGAL_UPDATED_DATE,
} from "@/lib/constants/legal";
import {
  LegalList,
  LegalPage,
  LegalSection,
  LegalSensitive,
  LegalSubheading,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "隐私政策 · SAST Link",
  description: "SAST Link 如何收集、使用、共享和保护您的个人信息",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="SAST LINK"
      title="隐私政策"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      updatedDate={LEGAL_UPDATED_DATE}
      operator={LEGAL_OPERATOR}
      contactEmail={LEGAL_CONTACT_EMAIL}
      footer={
        <Link href="/terms" className="text-link hover:underline">
          用户协议
        </Link>
      }
      intro={
        <>
          <p>
            本政策仅适用于{LEGAL_OPERATOR}（以下称“我们”）提供的 SAST Link
            统一身份认证服务，包括本站点及本站点为第三方应用提供的 OAuth 2.0 / OpenID
            Connect 身份认证功能。
          </p>
          <p>
            我们深知个人信息对您的重要性，并将尽全力保护您的个人信息安全。我们恪守权责一致、目的明确、选择同意、最小必要、确保安全、主体参与、公开透明等原则，按照通行的安全标准采取相应的保护措施。
          </p>
          <p>
            请您在注册账号或授权第三方应用前，仔细阅读并充分理解本政策。本政策中以下划线标注的信息属于个人敏感信息，请您在提供及授权共享时特别留意。
          </p>
        </>
      }
      summary={[
        "我们如何收集和使用您的个人信息",
        "我们如何共享您的个人信息",
        "我们如何使用本地存储技术",
        "我们如何保存您的个人信息",
        "我们如何保护您的个人信息",
        "您的权利及行使方式",
        "提供个人信息的风险与不提供的影响",
        "本政策如何更新",
        "如何联系我们",
      ]}
    >

      <LegalSection id="collect" index="01" title="我们如何收集和使用您的个人信息">
        <p>
          我们仅为实现下述业务功能收集您的个人信息，不会收集与业务功能无关的信息。按业务功能分别说明如下。
        </p>

        <LegalSubheading>（一）账号注册与登录</LegalSubheading>
        <p>为实现该功能，您需要向我们提供或允许我们收集的必要信息包括：</p>
        <LegalList>
          <li>
            登录邮箱：校园邮箱（@njupt.edu.cn）或 SAST
            邮箱（@sast.fun）。收集方式为您手动填写，用于确认您的校内身份、投递验证码、标识您的账号以及在您忘记密码时验证身份。
          </li>
          <li>
            登录密码：收集方式为您手动设置。我们仅存储该密码经加盐哈希处理后的值，不存储也无法还原您的原始密码。
          </li>
        </LegalList>
        <p>
          若您不提供上述信息，我们将无法为您创建账号，您也无法使用本服务及依赖本服务登录的第三方应用。
        </p>

        <LegalSubheading>（二）资料完善与校内身份核验</LegalSubheading>
        <p>为实现该功能，您需要向我们提供或允许我们收集的必要信息包括：</p>
        <LegalList>
          <li>
            真实姓名、<LegalSensitive>学号</LegalSensitive>、学院、专业：收集方式为您手动填写，用于核验您的在校学生身份、区分社团成员身份并据此分配相应的访问权限。
          </li>
          <li>
            <LegalSensitive>手机号</LegalSensitive>、QQ 号：收集方式为您手动填写，用于组织内部联络。
          </li>
          <li>昵称：收集方式为您手动填写，用于在本服务及经您授权的第三方应用中标识您。</li>
        </LegalList>
        <p>若您不提供上述信息，我们将无法完成您的资料核验，您也无法正常使用本服务。</p>
        <p>您可自主选择是否向我们提供下列信息：</p>
        <LegalList>
          <li>备用邮箱：收集方式为您手动填写，用于辅助登录。</li>
          <li>
            头像、部门、个人简介、博客地址、GitHub
            地址：收集方式为您手动填写或上传，用于在本服务及经您授权的第三方应用中展示您的公开资料。
          </li>
        </LegalList>
        <p>
          上述可选信息并非业务功能运行所必需。您拒绝提供不会影响您注册、登录及使用统一身份认证功能，仅可能导致相关展示或联络功能无法实现。
        </p>

        <LegalSubheading>（三）第三方账号绑定与快捷登录</LegalSubheading>
        <p>
          若您选择绑定 GitHub 或飞书账号，我们会收集该平台在您授权后返回的账号唯一标识符及基础身份信息，收集方式为该平台接口返回，用于建立绑定关系并支持您后续通过该平台快捷登录。不绑定不影响使用邮箱密码登录。
        </p>

        <LegalSubheading>（四）统一身份认证与第三方应用授权</LegalSubheading>
        <p>
          当第三方应用请求验证您的身份时，我们会收集并记录您的授权操作、被授权的应用、授权范围与授权时间，收集方式为系统自动记录，用于执行您的授权决定、向您展示已授权应用列表并支持您随时撤回授权。
        </p>

        <LegalSubheading>（五）安全保障与审计</LegalSubheading>
        <p>为保障账号与服务安全，我们会自动收集：</p>
        <LegalList>
          <li>
            操作类型、目标资源、操作结果、操作时间、
            <LegalSensitive>IP 地址</LegalSensitive>
            、浏览器及设备标识（User-Agent）：收集方式为系统自动记录，用于识别异常登录、防范账号盗用与滥用、排查服务故障，以及满足法律法规对网络日志留存的要求。
          </li>
        </LegalList>
        <p>
          该项收集是保障服务安全所必需，属于《个人信息保护法》所规定的为履行法定义务及维护服务安全稳定运行所必要的情形。
        </p>

        <LegalSubheading>（六）征得授权同意的例外</LegalSubheading>
        <p>
          根据法律法规规定，在与履行法定义务相关、与公共安全或重大公共利益直接相关、为维护您或他人重大合法权益但难以取得本人同意、以及维护所提供服务的安全稳定运行所必需等情形下，我们收集和使用您的个人信息无需另行征得您的授权同意。
        </p>
        <p>
          如我们需要将您的个人信息用于超出上述目的的其他用途，或基于特定目的收集的信息将用于其他目的，我们会事先向您说明并再次征得您的明示同意。
        </p>
      </LegalSection>
      <LegalSection
        id="share"
        index="02"
        title="我们如何共享您的个人信息"
      >
        <p>
          SAST Link 的核心功能是在您授权后，代您向第三方应用证明身份。除下述情形外，我们绝不会与任何第三方共享您的个人信息。
        </p>
        <p>
            我们仅在您显式向特定应用授权后，才向该应用共享信息，且严格限于该应用所申请的授权范围：
        </p>
        <LegalList>
          <li>
            <code className="text-sm">openid</code>：共享您在该应用下的身份标识符，不包含任何可直接识别您本人的资料。
          </li>
          <li>
            <code className="text-sm">profile</code>：共享您的昵称、姓名、头像、个人简介等公开资料。
          </li>
          <li>
            <code className="text-sm">email</code>：共享您的邮箱地址。
          </li>
          <li>
            <code className="text-sm">user:read</code>：共享您的姓名、
            <LegalSensitive>学号</LegalSensitive>、
            <LegalSensitive>手机号</LegalSensitive>、学院、专业、QQ 号等资料。该范围包含个人敏感信息，请您仅授权给您确认信任的应用。
          </li>
          <li>
            <code className="text-sm">user:write</code>：允许该应用代您修改资料、头像及身份绑定关系。
          </li>
        </LegalList>
        <p>
          授权页面会在您确认前逐项列出该应用申请的范围与应用名称。您可随时在
          <Link href="/settings/apps" className="text-link hover:underline">
            设置 · 已授权应用
          </Link>
          中查看并撤回授权。
        </p>
        <p>
          接收方的责任：第三方应用为独立的个人信息处理者，应就其获取信息后的处理行为独立承担安全与法律责任，并受其自身隐私政策约束。我们要求接入本服务的应用仅在其声明的目的范围内使用所获信息；我们无法控制且不对其处理行为负责。
        </p>
      </LegalSection>

      <LegalSection id="storage" index="03" title="我们如何使用本地存储技术">
        <p>
          我们不使用任何第三方广告或数据分析类 Cookie，也不追踪您在其他站点的浏览行为。我们仅在您的浏览器本地保存下列信息：
        </p>
        <LegalList>
          <li>
            登录凭据：短期访问令牌保存于 sessionStorage，关闭标签页后即清除；长期刷新凭据以 httpOnly Cookie 形式保存，页面脚本无法读取。该项为维持您的登录状态所必需。
          </li>
          <li>
            使用偏好：上次使用的登录账号地址与界面主题设置保存于
            localStorage，仅用于改善您下次访问的体验。您可通过清除浏览器数据移除，这不会影响您正常使用本服务。
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="retention" index="04" title="我们如何保存您的个人信息">
        <LegalList>
          <li>
            存储地域：您的个人信息存储于中华人民共和国境内的
            {LEGAL_HOSTING_REGION}服务器。我们不会将您的个人信息传输至境外，也不存在数据出境情形。
          </li>
          <li>
            账号信息：在您的账号存续期间保留，用于持续为您提供服务。
          </li>
          <li>
            安全审计日志：自记录之日起保留 {LEGAL_AUDIT_LOG_RETENTION}
            ，到期后删除或匿名化处理。
          </li>
          <li>
            账号注销后：{LEGAL_DELETED_ACCOUNT_RETENTION}。法律法规要求留存的记录，我们将按法定期限保留，并在期限届满后删除或匿名化处理。
          </li>
        </LegalList>
        <p>
          超出上述保留期限后，我们将对您的个人信息进行删除或匿名化处理。
        </p>
      </LegalSection>

      <LegalSection id="security" index="05" title="我们如何保护您的个人信息">
        <p>我们已采取符合业界标准的安全措施，防止个人信息遭到未经授权的访问、泄露、篡改或丢失：</p>
        <LegalList>
          <li>全站启用 HTTPS 加密传输，防止信息在传输过程中被窃取或篡改。</li>
          <li>登录密码采用加盐哈希算法存储，不可逆向还原。</li>
          <li>
            长期登录凭据以 httpOnly Cookie 承载，并支持整族会话撤销，降低凭据泄露带来的风险。
          </li>
          <li>
            对内部管理人员实行最小必要授权，按角色控制数据访问范围，并将管理操作全量记入审计日志。
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="rights" index="06" title="您的权利及行使方式">
        <p>
          按照中国相关法律法规与国家标准，我们保障您对自己的个人信息行使以下权利。您可自行操作或通过 {LEGAL_CONTACT_EMAIL} 与我们联系，我们将在核验您的身份后于 {LEGAL_RESPONSE_DAYS}内予以答复。
        </p>
        <LegalList>
          <li>
            查阅与复制：您可在
            <Link href="/profile" className="text-link hover:underline">
              个人资料
            </Link>
            中查阅我们所持有的您的资料。如需获取个人信息副本，可通过上述邮箱向我们提出。
          </li>
          <li>
            更正与补充：您可在
            <Link href="/profile/edit" className="text-link hover:underline">
              编辑资料
            </Link>
            中自行更正。学号等校内身份信息经确认后不可自行修改，如有错误请联系我们处理。
          </li>
          <li>
            撤回同意：您可在
            <Link href="/settings/apps" className="text-link hover:underline">
              已授权应用
            </Link>
            中撤回对任一第三方应用的授权，或解除 GitHub / 飞书账号绑定。撤回同意不影响撤回前基于您的授权已开展的个人信息处理。
          </li>
          <li>
            注销账号：您可通过 {LEGAL_CONTACT_EMAIL} 申请注销账号。注销后您将无法再通过 SAST Link 登录任何关联应用。
          </li>
          <li>
            自动化决策：本服务不对您的个人信息进行自动化决策，也不进行用户画像或个性化推荐。
          </li>
          <li>
            获取本政策的解释：您有权要求我们对本政策的条款作出说明。
          </li>
        </LegalList>
        <p>
          行使上述权利不收取任何费用。为保护您的账号安全，我们在响应您的请求前可能需要验证您的身份；对于无正当理由重复提出、需要过多技术投入、或可能导致他人合法权益受到损害的请求，我们可能予以拒绝并向您说明理由。
        </p>
      </LegalSection>

      <LegalSection id="risk" index="07" title="提供个人信息的风险与不提供的影响">
        <p>
          提供个人信息可能存在的风险：尽管我们已采取本政策所述的安全措施，个人信息在网络传输与存储过程中仍可能因不可预见的技术攻击、您本人的凭据泄露或第三方应用的安全缺陷而面临泄露、篡改或丢失的风险。由于 SAST Link 是多个应用的统一登录入口，您的账号凭据一旦泄露，可能导致所有关联应用一并受到影响。请您妥善保管密码，谨慎评估第三方应用的可信度。
        </p>
        <p>
          不提供个人信息的影响：若您不提供注册与身份核验所必需的信息，我们将无法为您创建账号或核验您的校内身份，您将无法使用本服务及依赖本服务登录的第三方应用；若您仅拒绝提供可选信息，则不影响前述核心功能的使用。
        </p>
      </LegalSection>

      <LegalSection id="changes" index="08" title="本政策如何更新">
        <p>
          我们可能适时对本政策进行修订。未经您明确同意，我们不会削减您依据本政策所应享有的权利。对于重大变更，我们将以站内显著提示或邮件等方式通知您，并在本页公布更新后的版本。重大变更包括但不限于：
        </p>
        <LegalList>
          <li>服务模式发生重大变化，如处理个人信息的目的、类型、使用方式发生变化；</li>
          <li>个人信息共享或披露的主要对象发生变化；</li>
          <li>您参与个人信息处理方面的权利及其行使方式发生重大变化；</li>
          <li>我们的联系方式发生变化，或发生个人信息安全影响评估报告表明存在高风险。</li>
        </LegalList>
        <p>
          若您不同意更新后的政策，您应停止使用本服务并可申请注销账号；在更新生效后继续使用本服务，即视为您接受修订后的政策。
        </p>
      </LegalSection>

      <LegalSection id="contact" index="09" title="如何联系我们">
        <p>
          如您对本政策内容、您的个人信息处理情况有任何疑问、意见或需要行使前述权利，可通过以下方式与我们联系：
        </p>
        <LegalList>
          <li>个人信息处理者：{LEGAL_OPERATOR}</li>
          <li>联系邮箱：{LEGAL_CONTACT_EMAIL}</li>
        </LegalList>
        <p>我们将在核验您的身份后于 {LEGAL_RESPONSE_DAYS}内予以答复。</p>
      </LegalSection>
    </LegalPage>
  );
}
