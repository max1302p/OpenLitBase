import { de } from '@litbase/shared'
import { env } from '../env'
import { readVersion } from '../version'

/** Feste Add-in-ID: Word erkennt das Add-in darüber auch nach Updates wieder. */
const ADDIN_ID = 'af3785db-4f02-4d90-8331-6f45ff1fd791'

function escapeXml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Office verlangt eine vierteilige Version ab 1.0: Hauptversion + 1, damit sie auch nach 1.0
 * weiter steigt (`0.7.0` → `1.7.0.0`, `1.0.0` → `2.0.0.0`).
 */
function manifestVersion() {
  const [major = 0, ...rest] = readVersion()
    .split('.')
    .filter((p) => /^\d+$/.test(p))
    .map(Number)
  return [major + 1, ...rest, 0, 0, 0].slice(0, 4).join('.')
}

/**
 * XML-Manifest für Word (Taskpane + Knopf im Start-Menüband). Alle URLs zeigen auf `BASE_URL`,
 * damit dasselbe Image ohne Anpassung unter jeder Domain funktioniert.
 */
export function renderManifest() {
  const base = env.BASE_URL.replace(/\/$/, '')
  const url = (path: string) => escapeXml(`${base}${path}`)
  const name = escapeXml(de.appName)
  const description = escapeXml(de.addin.manifestDescription)
  const button = escapeXml(de.addin.ribbonButton)
  const tooltip = escapeXml(de.addin.ribbonTooltip)
  const icon = url('/addin/icon.png')

  return `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
  xmlns:ov="http://schemas.microsoft.com/office/taskpaneappversionoverrides"
  xsi:type="TaskPaneApp">
  <Id>${ADDIN_ID}</Id>
  <Version>${manifestVersion()}</Version>
  <ProviderName>${name}</ProviderName>
  <DefaultLocale>de-DE</DefaultLocale>
  <DisplayName DefaultValue="${name}"/>
  <Description DefaultValue="${description}"/>
  <IconUrl DefaultValue="${icon}"/>
  <HighResolutionIconUrl DefaultValue="${icon}"/>
  <SupportUrl DefaultValue="${url('/')}"/>
  <AppDomains>
    <AppDomain>${url('')}</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Document"/>
  </Hosts>
  <Requirements>
    <Sets DefaultMinVersion="1.1">
      <Set Name="WordApi" MinVersion="1.3"/>
    </Sets>
  </Requirements>
  <DefaultSettings>
    <SourceLocation DefaultValue="${url('/addin/')}"/>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
      <Host xsi:type="Document">
        <DesktopFormFactor>
          <GetStarted>
            <Title resid="OLB.Name"/>
            <Description resid="OLB.Tooltip"/>
            <LearnMoreUrl resid="OLB.Home"/>
          </GetStarted>
          <FunctionFile resid="OLB.Taskpane"/>
          <ExtensionPoint xsi:type="PrimaryCommandSurface">
            <OfficeTab id="TabHome">
              <Group id="OLB.Group">
                <Label resid="OLB.Name"/>
                <Icon>
                  <bt:Image size="16" resid="OLB.Icon"/>
                  <bt:Image size="32" resid="OLB.Icon"/>
                  <bt:Image size="80" resid="OLB.Icon"/>
                </Icon>
                <Control xsi:type="Button" id="OLB.OpenTaskpane">
                  <Label resid="OLB.Button"/>
                  <Supertip>
                    <Title resid="OLB.Button"/>
                    <Description resid="OLB.Tooltip"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="OLB.Icon"/>
                    <bt:Image size="32" resid="OLB.Icon"/>
                    <bt:Image size="80" resid="OLB.Icon"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <TaskpaneId>OpenLitBase</TaskpaneId>
                    <SourceLocation resid="OLB.Taskpane"/>
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
    </Hosts>
    <Resources>
      <bt:Images>
        <bt:Image id="OLB.Icon" DefaultValue="${icon}"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="OLB.Taskpane" DefaultValue="${url('/addin/')}"/>
        <bt:Url id="OLB.Home" DefaultValue="${url('/')}"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="OLB.Name" DefaultValue="${name}"/>
        <bt:String id="OLB.Button" DefaultValue="${button}"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="OLB.Tooltip" DefaultValue="${tooltip}"/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
`
}
