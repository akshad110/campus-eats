import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Users, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {t("privacyPolicy.title")}
            </h1>
          </div>
          <p className="text-gray-600">
            {t("privacyPolicy.lastUpdated")}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                {t("privacyPolicy.introduction")}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.introPara1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("privacyPolicy.introPara2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-600" />
                {t("privacyPolicy.informationWeCollect")}
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">1. {t("privacyPolicy.personalInformation")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.personalInfoDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("privacyPolicy.personalInfoList1")}</li>
                <li>{t("privacyPolicy.personalInfoList2")}</li>
                <li>{t("privacyPolicy.personalInfoList3")}</li>
                <li>{t("privacyPolicy.personalInfoList4")}</li>
                <li>{t("privacyPolicy.personalInfoList5")}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2. {t("privacyPolicy.usageInformation")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.usageInfoDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("privacyPolicy.usageInfoList1")}</li>
                <li>{t("privacyPolicy.usageInfoList2")}</li>
                <li>{t("privacyPolicy.usageInfoList3")}</li>
                <li>{t("privacyPolicy.usageInfoList4")}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3. {t("privacyPolicy.shopkeeperInformation")}</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.shopkeeperInfoDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>{t("privacyPolicy.shopkeeperInfoList1")}</li>
                <li>{t("privacyPolicy.shopkeeperInfoList2")}</li>
                <li>{t("privacyPolicy.shopkeeperInfoList3")}</li>
                <li>{t("privacyPolicy.shopkeeperInfoList4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                {t("privacyPolicy.howWeUse")}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.howWeUseDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("privacyPolicy.howWeUseList1")}</li>
                <li>{t("privacyPolicy.howWeUseList2")}</li>
                <li>{t("privacyPolicy.howWeUseList3")}</li>
                <li>{t("privacyPolicy.howWeUseList4")}</li>
                <li>{t("privacyPolicy.howWeUseList5")}</li>
                <li>{t("privacyPolicy.howWeUseList6")}</li>
                <li>{t("privacyPolicy.howWeUseList7")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                {t("privacyPolicy.informationSharing")}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.sharingDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("privacyPolicy.sharingList1")}</li>
                <li>{t("privacyPolicy.sharingList2")}</li>
                <li>{t("privacyPolicy.sharingList3")}</li>
                <li>{t("privacyPolicy.sharingList4")}</li>
                <li>{t("privacyPolicy.sharingList5")}</li>
                <li>{t("privacyPolicy.sharingList6")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("privacyPolicy.dataSecurity")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.dataSecurityDesc1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("privacyPolicy.dataSecurityDesc2")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("privacyPolicy.yourRights")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.rightsDesc")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>{t("privacyPolicy.rightsList1")}</li>
                <li>{t("privacyPolicy.rightsList2")}</li>
                <li>{t("privacyPolicy.rightsList3")}</li>
                <li>{t("privacyPolicy.rightsList4")}</li>
                <li>{t("privacyPolicy.rightsList5")}</li>
                <li>{t("privacyPolicy.rightsList6")}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                {t("privacyPolicy.rightsContact")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("privacyPolicy.dataRetention")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("privacyPolicy.retentionDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("privacyPolicy.childrensPrivacy")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("privacyPolicy.childrensDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("privacyPolicy.changesToPolicy")}</h2>
              <p className="text-gray-700 leading-relaxed">
                {t("privacyPolicy.changesDesc")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("privacyPolicy.contactUs")}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t("privacyPolicy.contactDesc")}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>{t("privacyPolicy.email")}:</strong> akshadvengurlekar35@gmail.com
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>{t("privacyPolicy.address")}:</strong> {t("privacyPolicy.addressValue")}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

