import { SettingsView } from '@/features/settings/settings-view';
export default function SettingsPage() {
  return (
    <SettingsView
      timezones={Intl.supportedValuesOf('timeZone')}
      currencies={Intl.supportedValuesOf('currency')}
    />
  );
}
