import type { Metadata } from "next";
import Link from "next/link";

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DELETED_ACCOUNT_RETENTION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_OPERATOR,
  LEGAL_RESPONSE_DAYS,
  LEGAL_UPDATED_DATE,
} from "@/lib/constants/legal";
import {
  LegalList,
  LegalPage,
  LegalSection,
  LegalSubheading,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "用户协议 · SAST Link",
  description: "使用 SAST Link 统一身份认证服务的条款与规则",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="SAST LINK"
      title="用户协议"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      updatedDate={LEGAL_UPDATED_DATE}
      operator={LEGAL_OPERATOR}
      contactEmail={LEGAL_CONTACT_EMAIL}
      footer={
        <Link href="/privacy" className="text-link hover:underline">
          隐私政策
        </Link>
      }
      intro={
        <>
          <p>
            本协议是您与{LEGAL_OPERATOR}（以下称“我们”）之间就您使用 SAST Link
            统一身份认证服务（以下称“本服务”）所订立的协议。
          </p>
          <p>
            请您在注册账号或使用本服务前，仔细阅读并充分理解本协议全部内容，特别是免除或限制我们责任、以及涉及您重要权利义务的条款。您勾选同意、注册账号或实际使用本服务，即表示您已阅读、理解并同意接受本协议的全部约定。若您不同意本协议任何内容，请勿注册或使用本服务。
          </p>
        </>
      }
      summary={[
        "服务内容与服务性质",
        "账号注册与实名信息",
        "账号安全与使用规则",
        "第三方应用授权",
        "用户行为规范",
        "您发布的内容",
        "违规处理与账号注销",
        "服务变更、中断与终止",
        "免责声明与责任限制",
        "个人信息保护",
        "知识产权",
        "协议的变更、法律适用与争议解决",
      ]}
    >

      <LegalSection id="service" index="01" title="服务内容与服务性质">
        <p>
          本服务是基于 OAuth 2.0 / OpenID Connect 协议构建的统一身份认证平台，为您提供下列功能：
        </p>
        <LegalList>
          <li>统一账号的注册、登录、密码修改与账号找回；</li>
          <li>作为身份提供方，在您授权后代您向第三方应用证明身份；</li>
          <li>个人资料维护、第三方账号绑定与已授权应用管理。</li>
        </LegalList>
        <p>
          本服务由我们作为高校学生社团的内部信息化设施免费提供，不以营利为目的。我们保留根据运营需要新增、调整、暂停或终止部分功能的权利；涉及您主要权利义务的变更，我们将提前通过站内提示或邮件方式公告。
        </p>
      </LegalSection>

      <LegalSection id="registration" index="02" title="账号注册与实名信息">
        <LegalList>
          <li>
            本服务面向南京邮电大学在校学生、SAST 成员及经我们许可的其他人员。注册时您需使用校园邮箱（@njupt.edu.cn）或 SAST 邮箱（@sast.fun）完成邮箱验证。
          </li>
          <li>
            您应保证所提供的注册信息真实、准确、完整、合法有效，包括真实姓名、学号、学院与专业。信息发生变更时，您应及时更新。学号在注册完成后不可自行修改，如有错误请联系我们处理。
          </li>
          <li>
            您承诺不以虚假信息注册，不冒用他人身份信息注册，不批量注册账号。原则上一名用户仅可注册一个账号。
          </li>
          <li>
            账号仅供您本人使用。未经我们书面同意，您不得以任何形式出借、转让、出租、赠与或与他人共享账号。
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="security" index="03" title="账号安全与使用规则">
        <LegalList>
          <li>
            您应自行设置强度足够的密码并妥善保管账号及密码，不得向他人透露密码、验证码或其他登录凭据。
          </li>
          <li>
            本服务是多个应用的统一登录入口，您的账号凭据一旦泄露，可能导致全部关联应用的账号安全同时受到影响。如您发现账号存在异常登录、密码泄露或被他人未经授权使用的情形，应立即修改密码并通过 {LEGAL_CONTACT_EMAIL} 通知我们。
          </li>
          <li>
            除法律法规另有规定外，凡使用您的账号及密码所进行的操作，均视为您本人的行为，由此产生的后果由您承担；但您已举证证明系他人非法使用且该情形非因您的过错所致的除外。
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="authorization" index="04" title="第三方应用授权">
        <LegalList>
          <li>
            当第三方应用请求获取您的身份信息时，我们会向您展示该应用名称与其申请的授权范围，并仅在您明确点击同意后共享相应信息。您应自行判断该应用是否值得信任，并自主决定是否授权。
          </li>
          <li>
            第三方应用为独立的服务提供者与个人信息处理者，其如何使用您的信息受其自身协议与隐私政策约束。我们不对第三方应用的行为、内容、服务质量及信息安全承担责任。
          </li>
          <li>
            您可随时在
            <Link href="/settings/apps" className="text-link hover:underline">
              设置 · 已授权应用
            </Link>
            中撤回授权。撤回授权仅阻止我们后续继续共享信息，不能追回该应用此前已获取的信息，亦不影响撤回前基于您的授权已开展的处理行为。
          </li>
          <li>
            如您作为开发者接入本服务注册 OAuth 客户端，您应遵守我们的接入规范，仅申请业务所必需的最小授权范围，妥善保管客户端密钥，并就您所获取信息的处理行为独立承担法律责任。
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="conduct" index="05" title="用户行为规范">
        <p>您在使用本服务时，应遵守法律法规及本协议约定，不得从事下列行为：</p>

        <LegalSubheading>（一）违法违规行为</LegalSubheading>
        <LegalList>
          <li>违反法律法规、危害国家安全、损害公共利益或他人合法权益；</li>
          <li>发布、传播法律法规禁止的信息内容。</li>
        </LegalList>

        <LegalSubheading>（二）危害服务安全的行为</LegalSubheading>
        <LegalList>
          <li>
            未经我们书面授权，对本服务或其后端接口实施扫描、探测、渗透测试或其他形式的安全测试；
          </li>
          <li>
            实施撞库、暴力破解、越权访问、注入攻击等行为，或以任何方式尝试获取他人账号及个人信息；
          </li>
          <li>
            逆向工程、破解或绕过本服务的认证与授权机制，伪造、篡改身份令牌，或利用系统漏洞获取超出授权范围的权限；
          </li>
          <li>
            使用自动化脚本或工具批量注册账号、批量调用接口，或以异常频率访问本服务，干扰或试图干扰服务的正常运行；
          </li>
          <li>
            以本服务或我们的名义注册 OAuth 客户端实施钓鱼，或以其他方式骗取他人登录凭据及个人信息。
          </li>
        </LegalList>
        <p>
          我们欢迎负责任的漏洞披露。如您发现安全漏洞，请通过 {LEGAL_CONTACT_EMAIL}
          告知我们，并在我们完成修复前不对外披露、不利用该漏洞获取或破坏数据。
        </p>
      </LegalSection>

      <LegalSection id="content" index="06" title="您发布的内容">
        <p>
          昵称、头像、个人简介、外部链接等由您自行填写或上传的内容，其权利与相应责任均由您承担。您应保证该等内容不侵犯任何第三方的合法权益，不含有违法、淫秽、暴力、侮辱诽谤或其他不适当的信息。
        </p>
        <p>
            对于违反前述约定的内容，我们有权不经事先通知予以删除、屏蔽或重置，并可依据本协议第七条对您的账号采取相应措施。
        </p>
      </LegalSection>

      <LegalSection id="suspension" index="07" title="违规处理与账号注销">
        <LegalList>
          <li>
            如您违反本协议或法律法规，或您的行为危及本服务及其他用户的安全，我们可根据情节轻重，采取警示提醒、限制功能、暂停使用、封禁账号等措施，并保留追究法律责任的权利。
          </li>
          <li>
            情况紧急时（如您的账号正被用于实施攻击或已发生凭据泄露），我们可先行采取处置措施，再于合理期限内通知您。您如对处置结果有异议，可通过 {LEGAL_CONTACT_EMAIL} 与我们联系，我们将在 {LEGAL_RESPONSE_DAYS}内予以答复。
          </li>
          <li>
            您可随时通过 {LEGAL_CONTACT_EMAIL} 申请注销账号。注销后，您将无法再通过 SAST Link 登录任何关联应用，
            {LEGAL_DELETED_ACCOUNT_RETENTION}。
          </li>
          <li>
            您毕业、离职或离开本组织后，我们可能依据内部管理规定调整您的角色与访问权限，但不因此单独注销您的账号。
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="availability" index="08" title="服务变更、中断与终止">
        <p>
          我们将努力维持本服务的稳定运行，但本服务按“现状”和“现有”基础提供，我们不承诺服务不会中断，亦不承诺服务绝对无差错、能满足您的全部需求或永久可用。
        </p>
        <p>下列情形导致的服务中断或数据受损，我们不承担责任，但会尽力及时恢复并予以公告：</p>
        <LegalList>
          <li>系统维护、升级、迁移或配置调整；</li>
          <li>网络故障、电力中断、服务器硬件故障；</li>
          <li>
            所依赖的第三方服务（包括 GitHub、飞书、邮件投递服务、云服务商等）发生故障、调整接口或终止服务；
          </li>
          <li>黑客攻击、计算机病毒侵入或其他技术性破坏行为；</li>
          <li>台风、地震、疫情、战争、政府行为等不可抗力事件。</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="disclaimer" index="09" title="免责声明与责任限制">
        <p>
            在法律允许的最大范围内，我们不对因使用或无法使用本服务而导致的任何间接损失、附带损失、利润损失、数据丢失或商誉损失承担责任。
        </p>
        <p>
            鉴于本服务系免费提供的学生社团内部设施，如我们依法应当承担赔偿责任，该责任范围以您因此遭受的直接损失为限。
        </p>
        <p>
          前述责任限制不适用于因我们的故意或重大过失所致的损害，也不排除或限制法律法规规定不得排除或限制的责任。
        </p>
      </LegalSection>

      <LegalSection id="privacy" index="10" title="个人信息保护">
        <p>
          我们如何收集、使用、共享、存储和保护您的个人信息，以及您就个人信息享有的权利及行使方式，详见
          <Link href="/privacy" className="text-link hover:underline">
            隐私政策
          </Link>
          。该政策构成本协议不可分割的组成部分，与本协议具有同等效力。
        </p>
      </LegalSection>

      <LegalSection id="ip" index="11" title="知识产权">
        <p>
          本服务所包含的软件代码、页面设计、图标、商标及文档等，其知识产权归我们或相应权利人所有。除法律法规许可或取得书面授权外，您不得复制、修改、传播、出售或用于商业目的。
        </p>
        <p>
          您在本服务中上传或填写的内容，其知识产权归您所有。为向您提供本服务及执行您的授权决定，您授予我们在服务范围内存储、展示及向经您授权的第三方应用传输该等内容的必要许可。
        </p>
      </LegalSection>

      <LegalSection id="misc" index="12" title="协议的变更、法律适用与争议解决">
        <LegalList>
          <li>
            我们可能适时修订本协议。涉及您权利义务的重大变更，我们将以站内显著提示或邮件方式通知您，并在本页公布更新后的版本。变更生效后您继续使用本服务，即视为您接受修订后的协议；若您不同意，应停止使用本服务并可申请注销账号。
          </li>
          <li>
            本协议的订立、生效、解释、履行及争议解决，均适用中华人民共和国法律（不含港澳台地区法律）。
          </li>
          <li>
            因本协议或本服务产生的争议，双方应通过友好协商解决。
          </li>
          <li>
            本协议部分条款被认定为无效或不可执行的，不影响其余条款的效力，该等条款应在最大允许范围内作有效解释。
          </li>
          <li>
            我们未行使或未及时行使本协议项下的任何权利，不构成对该权利的放弃。
          </li>
        </LegalList>
        <p>
          如您对本协议有任何疑问或意见，请通过 {LEGAL_CONTACT_EMAIL} 与{LEGAL_OPERATOR}联系。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
