using System;
using System.Runtime.InteropServices;

namespace EarTrumpet.Interop.MMDeviceAPI
{
    [Guid("ab3d4648-e242-459f-b02f-541c70306324")]
    // The factory is exposed as a WinRT IInspectable, but .NET 8 cannot cast
    // a raw activation-factory pointer through InterfaceIsIInspectable. Its
    // ABI is still an IUnknown-compatible vtable, so use the COM projection.
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioPolicyConfigFactoryVariantFor21H2
    {
        // IInspectable ABI slots. They must be declared explicitly when the
        // interface is projected as IUnknown so the endpoint methods keep the
        // correct vtable offsets.
        int GetIids(out uint iidCount, out IntPtr iids);
        int GetRuntimeClassName(out IntPtr className);
        int GetTrustLevel(out int trustLevel);
        int __incomplete__add_CtxVolumeChange();
        int __incomplete__remove_CtxVolumeChanged();
        int __incomplete__add_RingerVibrateStateChanged();
        int __incomplete__remove_RingerVibrateStateChange();
        int __incomplete__SetVolumeGroupGainForId();
        int __incomplete__GetVolumeGroupGainForId();
        int __incomplete__GetActiveVolumeGroupForEndpointId();
        int __incomplete__GetVolumeGroupsForEndpoint();
        int __incomplete__GetCurrentVolumeContext();
        int __incomplete__SetVolumeGroupMuteForId();
        int __incomplete__GetVolumeGroupMuteForId();
        int __incomplete__SetRingerVibrateState();
        int __incomplete__GetRingerVibrateState();
        int __incomplete__SetPreferredChatApplication();
        int __incomplete__ResetPreferredChatApplication();
        int __incomplete__GetPreferredChatApplication();
        int __incomplete__GetCurrentChatApplications();
        int __incomplete__add_ChatContextChanged();
        int __incomplete__remove_ChatContextChanged();
        [PreserveSig]
        HRESULT SetPersistedDefaultAudioEndpoint(uint processId, EDataFlow flow, ERole role, IntPtr deviceId);
        [PreserveSig]
        HRESULT GetPersistedDefaultAudioEndpoint(uint processId, EDataFlow flow, ERole role, out IntPtr deviceId);
        [PreserveSig]
        HRESULT ClearAllPersistedApplicationDefaultEndpoints();
    }
}
