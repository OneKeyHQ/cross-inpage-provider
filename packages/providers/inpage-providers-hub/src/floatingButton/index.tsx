import { render } from 'preact';
import { useEffect, useMemo, useCallback, useRef, useState } from 'preact/hooks';
import { IHostSecurity, EHostSecurityLevel } from './type';
import { Logo } from './images';

let isInjected = false;
interface i18nText {
  title: string;
  description: string;
  continueMessage: string;
  continueLink: string;
  addToWhiteListLink: string;
  sourceMessage: string;
  fetchingDAppInfo: string;
  dappListedBy: string;
  riskDetection: string;
  maliciousDappWarningSourceMessage: string;
  verifiedSite: string;
  unknown: string;
  maliciousSiteWarning: string;
  suspectedMaliciousBehavior: string;
  lastVerifiedAt: string;
  disable: string;
  hideOnThisSite: string;
  canBeReEnabledInSettings: string;
}

let i18n: i18nText = {} as i18nText;

const logoStyle = {
  width: '24px',
  height: '24px',
};

const textStyle = {
  color: 'rgba(0, 0, 0, 0.61)',
  fontSize: '14px',
  marginLeft: '8px',
};

const containerId = 'onekey-floating-widget';

const removeIcon = () => {
  document.getElementById(containerId)?.remove();
  isInjected = false;
}

const useOutsideClick = (ref: { current?: HTMLDivElement | null }, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback, ref]);
};
function CloseDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(dialogRef, onClose);
  const handleDisable = useCallback(() => {
    void (
      globalThis as unknown as {
        $onekey: {
          $private: {
            request: (arg: { method: string }) => Promise<void>;
          };
        };
      }
    ).$onekey.$private.request({
      method: 'wallet_disableFloatingButton',
    });
    removeIcon();
  }, [])
  const handleHideOnSite = useCallback(() => {
    void (
      globalThis as unknown as {
        $onekey: {
          $private: {
            request: (arg: { method: string; params: { url: string } }) => Promise<void>;
          };
        };
      }
    ).$onekey.$private.request({
      method: 'wallet_hideFloatingButtonOnSite',
      params: { url: window.location.origin },
    });
    removeIcon();
  }, [])
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        position: 'absolute',
        right: '100%',
        background: '#fff',
        top: '40px',
        width: '196px',
        borderRadius: '12px',
        boxShadow:
          '0px 0px 0px 1px rgba(0, 0, 0, 0.05),0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        color: 'rgba(0, 0, 0, 1)',
        fontSize: '12px',
        lineHeight: '16px',
      }}
      ref={dialogRef}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          gap: '8px',
        }}
        onClick={handleHideOnSite}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M2.29312 2.2929C2.68364 1.90237 3.31681 1.90237 3.70734 2.29289L7.35069 5.9362L21.7073 20.2929C22.0979 20.6834 22.0979 21.3166 21.7073 21.7071C21.3168 22.0976 20.6836 22.0976 20.2931 21.7071L17.2031 18.617C14.684 20.0216 11.8704 20.363 9.19337 19.6107C6.27083 18.7893 3.59188 16.6894 1.6441 13.4178C1.12514 12.5461 1.12292 11.4579 1.64298 10.5841C2.63083 8.92441 3.8063 7.56606 5.10844 6.52239L2.29313 3.70711C1.9026 3.31659 1.9026 2.68342 2.29312 2.2929ZM6.53283 7.94678L7.41812 8.8321L8.5542 9.96818C8.20253 10.5636 8.00023 11.2586 8.00023 12C8.00023 14.2091 9.79109 16 12.0002 16C12.7416 16 13.4366 15.7977 14.0321 15.446L15.7203 17.1343C13.7862 18.0642 11.7083 18.24 9.73447 17.6852C7.37839 17.0231 5.08952 15.2953 3.36259 12.3947C3.21773 12.1514 3.21796 11.8483 3.36159 11.607C4.28389 10.0575 5.36713 8.84257 6.53283 7.94678ZM12.5184 13.9324L10.0678 11.4818C10.0237 11.647 10.0002 11.8207 10.0002 12C10.0002 13.1046 10.8957 14 12.0002 14C12.1796 14 12.3532 13.9765 12.5184 13.9324ZM20.6388 11.6068C18.1001 7.34166 14.3527 5.6013 10.8782 6.07652C10.331 6.15137 9.82679 5.76845 9.75195 5.22126C9.67711 4.67407 10.06 4.16981 10.6072 4.09497C15.0162 3.49193 19.4849 5.75792 22.3574 10.5838C22.8767 11.4564 22.8771 12.5429 22.3576 13.4157C21.9613 14.0815 21.535 14.6987 21.0823 15.2666C20.738 15.6985 20.1088 15.7695 19.677 15.4253C19.2451 15.081 19.1741 14.4519 19.5183 14.02C19.9123 13.5257 20.2873 12.9836 20.6389 12.3928C20.7831 12.1507 20.7831 11.8493 20.6388 11.6068Z"
            fill="rgba(0, 0, 0, 0.61)"
          />
        </svg>
        <div>{i18n.hideOnThisSite}</div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          gap: '8px',
        }}
        onClick={handleDisable}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 4C7.58172 4 4 7.58172 4 12C4 13.8491 4.62644 15.5506 5.68009 16.9057L16.9057 5.68009C15.5506 4.62644 13.8491 4 12 4ZM18.3199 7.0943L7.0943 18.3199C8.44939 19.3736 10.1509 20 12 20C16.4183 20 20 16.4183 20 12C20 10.1509 19.3736 8.44939 18.3199 7.0943ZM2 12C2 6.47715 6.47715 2 12 2C14.7611 2 17.2625 3.12038 19.0711 4.92893C20.8796 6.73748 22 9.23885 22 12C22 17.5228 17.5228 22 12 22C9.23885 22 6.73748 20.8796 4.92893 19.0711C3.12038 17.2625 2 14.7611 2 12Z"
            fill="rgba(0, 0, 0, 0.61)"
          />
        </svg>

        <div>{i18n.disable}</div>
      </div>

      <div
        style={{
          color: 'rgba(0, 0, 0, 0.61)',
          fontSize: '12px',
          lineHeight: '16px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        {i18n.canBeReEnabledInSettings}
      </div>
    </div>
  );
}

function IconButton({
  isExpanded,
  onClick,
  dataLoaded,
  isShowCloseDialog,
  showCloseDialog,
}: {
  isExpanded: boolean;
  isShowCloseDialog: boolean;
  onClick: () => void;
  dataLoaded: boolean;
  showCloseDialog: () => void;
}) {
  const [showCloseButton, setIsShowCloseButton] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
      }}
      onMouseEnter={() => {
        if (isExpanded || isShowCloseDialog) {
          return;
        }
        setIsShowCloseButton(true);
      }}
      onMouseLeave={() => setIsShowCloseButton(false)}
      onClick={() => {
        if (isShowCloseDialog) {
          return;
        }
        setIsShowCloseButton(false);
        onClick();
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px' }}>
        <Logo style={logoStyle} />
        {!dataLoaded && <span style={textStyle}>{isExpanded ? i18n.fetchingDAppInfo : ''}</span>}
      </div>
      <div
        style={{
          display: 'flex',
          padding: '$4',
          position: 'absolute',
          left: '-6px',
          bottom: '-10px',
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: showCloseButton ? 1 : 0,
          borderRadius: '9999px',
          backgroundColor: '#fff',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
        onClick={(event) => {
          event.stopPropagation();
          setIsShowCloseButton(false);
          showCloseDialog();
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289Z"
            fill="rgba(0, 0, 0, 0.61)"
          />
        </svg>
      </div>
    </div>
  );
}

function SecurityInfoRow({ title, children }: { title: string; children: any }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          color: 'rgba(0, 0, 0, 0.61)',
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

function SecurityRiskDetectionRow({ securityInfo }: { securityInfo: IHostSecurity }) {
  const { securityElement, securityStatus } = useMemo(() => {
    const security =
      securityInfo?.checkSources
        .filter((item) => item.riskLevel === EHostSecurityLevel.Security)
        .map((item) => item.name)
        .join(' & ') || '';
    if (security) {
      return {
        securityStatus: EHostSecurityLevel.Security,
        securityElement: (
          <>
            <span
              style={{
                color: 'rgba(0, 0, 0, 0.88)',
                fontWeight: '500',
                fontSize: '12px',
                lineHeight: '16px',
              }}
            >
              {i18n.verifiedSite}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                width="16"
                height="16"
                viewBox="0 0 24 24"
                d="M10.4673 2.69869C11.2767 1.76711 12.7232 1.7671 13.5326 2.69868L14.8908 4.26193C14.8977 4.26983 14.9082 4.27364 14.9185 4.272L16.9638 3.94755C18.1827 3.7542 19.2907 4.68395 19.3119 5.91786L19.3476 7.98845C19.3478 7.99891 19.3533 8.00854 19.3623 8.01393L21.1377 9.08009C22.1956 9.71544 22.4468 11.1399 21.6699 12.0988L20.3663 13.7079C20.3597 13.716 20.3578 13.7269 20.3612 13.7368L21.0359 15.6947C21.4379 16.8615 20.7147 18.1142 19.5032 18.3493L17.4703 18.744C17.46 18.746 17.4515 18.7531 17.4478 18.7629L16.7061 20.6964C16.2641 21.8487 14.9049 22.3434 13.8257 21.7448L12.0147 20.7404C12.0055 20.7353 11.9944 20.7353 11.9852 20.7404L10.1742 21.7448C9.09503 22.3434 7.73582 21.8487 7.29383 20.6964L6.55216 18.7629C6.54841 18.7531 6.53989 18.746 6.52962 18.744L4.49668 18.3493C3.2852 18.1142 2.56198 16.8615 2.96404 15.6947L3.63873 13.7368C3.64214 13.7269 3.64021 13.716 3.63362 13.7079L2.32998 12.0988C1.55311 11.1399 1.80428 9.71544 2.86226 9.08009L4.63762 8.01393C4.64659 8.00854 4.65215 7.99891 4.65233 7.98845L4.68797 5.91786C4.70921 4.68395 5.81725 3.7542 7.0361 3.94755L9.08142 4.272C9.09176 4.27364 9.10221 4.26983 9.10907 4.26193L10.4673 2.69869ZM15.2071 11.2071C15.5976 10.8166 15.5976 10.1834 15.2071 9.79289C14.8166 9.40237 14.1834 9.40237 13.7929 9.79289L11 12.5858L10.2071 11.7929C9.81655 11.4024 9.18339 11.4024 8.79286 11.7929C8.40234 12.1834 8.40234 12.8166 8.79286 13.2071L9.93931 14.3536C10.5251 14.9393 11.4748 14.9393 12.0606 14.3536L15.2071 11.2071Z"
                fill="#006B3B"
                fillOpacity="0.906"
              />
            </svg>
          </>
        ),
      };
    }
    const highSecurity =
      securityInfo?.checkSources
        .filter((item) => item.riskLevel === EHostSecurityLevel.High)
        .map((item) => item.name)
        .join(' & ') || '';

    if (highSecurity) {
      return {
        securityStatus: EHostSecurityLevel.High,
        securityElement: (
          <>
            <span
              style={{
                color: 'rgba(0, 0, 0, 0.88)',
                fontWeight: '500',
                fontSize: '12px',
                lineHeight: '16px',
              }}
            >
              {i18n.maliciousSiteWarning}
            </span>
            <svg
              width="18"
              height="16"
              viewBox="0 0 18 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.83981 2.21151C7.8045 0.557753 10.194 0.557748 11.1587 2.21151L17.007 12.2371C17.9792 13.9038 16.777 15.9968 14.8475 15.9968H3.15098C1.22151 15.9968 0.0193263 13.9038 0.991535 12.2371L6.83981 2.21151ZM9.00008 5.99683C9.46032 5.99683 9.83342 6.36992 9.83342 6.83016V9.33016C9.83342 9.7904 9.46032 10.1635 9.00008 10.1635C8.53984 10.1635 8.16675 9.7904 8.16675 9.33016V6.83016C8.16675 6.36992 8.53984 5.99683 9.00008 5.99683ZM7.95842 11.8302C7.95842 11.2549 8.42478 10.7885 9.00008 10.7885C9.57538 10.7885 10.0417 11.2549 10.0417 11.8302C10.0417 12.4055 9.57538 12.8718 9.00008 12.8718C8.42478 12.8718 7.95842 12.4055 7.95842 11.8302Z"
                fill="#BB0007"
                fillOpacity="0.836"
              />
            </svg>
          </>
        ),
      };
    }

    const mediumSecurity =
      securityInfo?.checkSources
        .filter((item) => EHostSecurityLevel.Medium == item.riskLevel)
        .map((item) => item.name)
        .join(' & ') || '';
    if (mediumSecurity) {
      return {
        securityStatus: EHostSecurityLevel.Medium,
        securityElement: (
          <>
            <span
              style={{
                color: 'rgba(0, 0, 0, 0.88)',
                fontWeight: '500',
                fontSize: '12px',
                lineHeight: '16px',
              }}
            >
              {i18n.suspectedMaliciousBehavior}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.96786 0.159913C3.52858 0.159899 3.14962 0.159886 2.83748 0.185389C2.50802 0.212306 2.18034 0.271736 1.86503 0.432398C1.39462 0.672081 1.01217 1.05453 0.772486 1.52494C0.611824 1.84025 0.552394 2.16794 0.525477 2.49739C0.499974 2.80953 0.499986 3.18849 0.500001 3.62776V11.692C0.499986 12.1313 0.499974 12.5103 0.525477 12.8224C0.552394 13.1519 0.611824 13.4796 0.772486 13.7949C1.01217 14.2653 1.39462 14.6477 1.86503 14.8874C2.18034 15.0481 2.50802 15.1075 2.83748 15.1344C3.14962 15.1599 3.52858 15.1599 3.96786 15.1599H12.0321C12.4714 15.1599 12.8504 15.1599 13.1625 15.1344C13.492 15.1075 13.8197 15.0481 14.135 14.8874C14.6054 14.6477 14.9878 14.2653 15.2275 13.7949C15.3882 13.4796 15.4476 13.1519 15.4745 12.8224C15.5 12.5103 15.5 12.1313 15.5 11.6921V3.62778C15.5 3.18849 15.5 2.80953 15.4745 2.49739C15.4476 2.16794 15.3882 1.84025 15.2275 1.52494C14.9878 1.05453 14.6054 0.672081 14.135 0.432398C13.8197 0.271736 13.492 0.212306 13.1625 0.185389C12.8504 0.159886 12.4714 0.159899 12.0322 0.159913H3.96786ZM6.33333 6.82658C6.33333 6.36634 6.70643 5.99325 7.16667 5.99325H8C8.46024 5.99325 8.83333 6.36634 8.83333 6.82658V10.9932C8.83333 11.4535 8.46024 11.8266 8 11.8266C7.53976 11.8266 7.16667 11.4535 7.16667 10.9932V7.65991C6.70643 7.65991 6.33333 7.28682 6.33333 6.82658ZM8 3.49325C7.53976 3.49325 7.16667 3.86634 7.16667 4.32658C7.16667 4.78682 7.53976 5.15991 8 5.15991C8.46024 5.15991 8.83333 4.78682 8.83333 4.32658C8.83333 3.86634 8.46024 3.49325 8 3.49325Z"
                fill="#5E4200"
                fillOpacity="0.844"
              />
            </svg>
          </>
        ),
      };
    }
    return {
      securityStatus: EHostSecurityLevel.Unknown,
      securityElement: (
        <span
          style={{
            color: 'rgba(0, 0, 0, 0.88)',
            fontWeight: '500',
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          {i18n.unknown}
        </span>
      ),
    };
  }, [securityInfo?.checkSources]);
  return (
    <SecurityInfoRow title={i18n.riskDetection}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3.2px',
        }}
      >
        {securityElement}
      </div>
    </SecurityInfoRow>
  );
}

function SecurityInfo({
  securityInfo,
  onClose,
  showCloseDialog,
}: {
  securityInfo: IHostSecurity;
  onClose: () => void;
  showCloseDialog: () => void;
}) {
  const viewRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(viewRef, onClose);
  return (
    <div
      ref={viewRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(0, 0, 0, 0.88)',
              fontSize: '14px',
              fontWeight: '500',
              overflow: 'hidden',
            }}
          >
            {securityInfo?.dapp?.logo ? (
              <img
                src={securityInfo?.dapp?.logo}
                style={{
                  height: '24px',
                  width: '24px',
                  borderRadius: '8px',
                }}
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: '24px',
                  height: '24px',
                }}
              >
                <path
                  d="M6.6234 6.17768C6.6234 4.79769 7.73338 3.66333 9.1234 3.66333C10.5134 3.66333 11.6234 4.79769 11.6234 6.17768C11.6234 7.30559 10.8798 7.89399 10.4435 8.19056C10.3054 8.28442 10.2138 8.36716 10.1499 8.45311C10.092 8.53086 10.0368 8.63774 10.0107 8.81185C9.92866 9.35801 9.41941 9.73426 8.87325 9.65224C8.3271 9.57021 7.95084 9.06096 8.03287 8.5148C8.19122 7.4605 8.81104 6.8819 9.31912 6.53656C9.47624 6.42975 9.54878 6.36136 9.58594 6.31084C9.60107 6.29027 9.60813 6.27529 9.61242 6.26261C9.61657 6.25036 9.6234 6.22488 9.6234 6.17768C9.6234 5.88426 9.39093 5.66333 9.1234 5.66333C8.85586 5.66333 8.6234 5.88426 8.6234 6.17768C8.6234 6.72996 8.17568 7.17768 7.6234 7.17768C7.07111 7.17768 6.6234 6.72996 6.6234 6.17768Z"
                  fill="#3C3C3C"
                />
                <path
                  d="M7.74976 11.5C7.74976 12.1904 8.3094 12.75 8.99976 12.75C9.69011 12.75 10.2498 12.1904 10.2498 11.5C10.2498 10.8096 9.69011 10.25 8.99976 10.25C8.3094 10.25 7.74976 10.8096 7.74976 11.5Z"
                  fill="#3C3C3C"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.00195 2.00272e-05L15.0019 0C16.6588 -2.7418e-06 18.002 1.34314 18.002 3V13.0358C18.002 14.6926 16.6588 16.0357 15.002 16.0358L12.3757 16.0358L8.99393 18.8375L5.65157 16.0358H3.00195C1.3451 16.0358 0.00195312 14.6926 0.00195312 13.0358V3.00002C0.00195312 1.34317 1.34509 2.2769e-05 3.00195 2.00272e-05ZM15.002 2L3.00195 2.00002C2.44967 2.00002 2.00195 2.44774 2.00195 3.00002V13.0358C2.00195 13.5881 2.44967 14.0358 3.00195 14.0358H5.65157C6.12143 14.0358 6.57629 14.2012 6.93638 14.503L9.00143 16.2341L11.0997 14.4957C11.4585 14.1984 11.9098 14.0358 12.3757 14.0358L15.002 14.0358C15.5542 14.0358 16.002 13.588 16.002 13.0358V3C16.002 2.44772 15.5542 2 15.002 2Z"
                  fill="#3C3C3C"
                />
              </svg>
            )}
            <span 
              style={{ 
                width: '100%', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}
            >
              {securityInfo?.dapp?.name || securityInfo?.host}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              width: '24',
              height: '24',
              cursor: 'pointer',
            }}
            onClick={() => {
              onClose();
              setTimeout(() => {
                showCloseDialog();
              }, 200);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289Z"
                fill="rgba(0, 0, 0, 0.61)"
              />
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 8px', gap: '12px' }}>
          {securityInfo?.dapp?.origins.length ? (
            <SecurityInfoRow title={i18n.dappListedBy}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                {securityInfo?.dapp?.origins.map((item) => (
                  <img
                    src={item.logo}
                    style={{
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '9999px',
                      width: '16px',
                      height: '16px',
                    }}
                  />
                ))}
              </div>
            </SecurityInfoRow>
          ) : null}
          <SecurityRiskDetectionRow securityInfo={securityInfo} />
          {securityInfo?.dapp?.origins.length ? (
            <SecurityInfoRow title={i18n.lastVerifiedAt}>
              <span
                style={{
                  fontWeight: '500',
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: 'rgba(0, 0, 0, 0.88)',
                }}
              >
                {securityInfo.updatedAt}
              </span>
            </SecurityInfoRow>
          ) : null}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 8px',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9F9F9',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <span
          style={{
            flex: 1,
            color: 'rgba(0, 0, 0, 0.61)',
            fontWeight: '400',
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          Powered by
        </span>
        <Logo
          style={{
            width: '14px',
            height: '14px',
          }}
        />
        <span
          style={{
            color: 'rgba(0, 0, 0, 0.88)',
            fontWeight: '500',
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          OneKey
        </span>
      </div>
    </div>
  );
}

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSecurityInfo, setIsShowSecurityInfo] = useState(false);
  const [securityInfo, setSecurityInfo] = useState<IHostSecurity | null>(null);
  const [showCloseDialog, setIsShowCloseDialog] = useState(false);

  const handleShowCloseDialog = useCallback(() => {
    setIsShowCloseDialog(true);
  }, []);

  const handleClick = useCallback(async () => {
    setIsExpanded(!isExpanded);
    setIsShowSecurityInfo(true);
    if (!securityInfo) {
      const result = await (
        window as unknown as {
          $onekey: {
            $private: {
              request: (arg: {
                method: string;
                params: { url: string };
              }) => Promise<{ securityInfo: IHostSecurity }>;
            };
          };
        }
      ).$onekey.$private.request({
        method: 'wallet_detectRiskLevel',
        params: { url: window.location.origin },
      });
      setSecurityInfo(result.securityInfo);
    }
  }, [isExpanded, securityInfo]);

  return (
    <div
      id={containerId}
      style={{
        position: 'fixed',
        zIndex: 999_999,
        top: '75%',
        right: '0px',
        width: '256px',
        background: '#fff',
        borderRadius: '12px',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow:
          '0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        transform: isExpanded ? 'translateX(-20px)' : 'translateX(216px)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        WebkitTextSizeAdjust: '100%',
        fontSmooth: 'antialiased',
      }}
    >
      {showSecurityInfo && securityInfo ? (
        <SecurityInfo
          securityInfo={securityInfo}
          showCloseDialog={handleShowCloseDialog}
          onClose={() => {
            setIsExpanded(false);
            setIsShowSecurityInfo(false);
          }}
        />
      ) : (
        <IconButton
          onClick={handleClick}
          isExpanded={isExpanded}
          isShowCloseDialog={showCloseDialog}
          showCloseDialog={handleShowCloseDialog}
          dataLoaded={!!securityInfo}
        />
      )}
      {!isExpanded && showCloseDialog && (
        <CloseDialog
          onClose={() => {
            setIsShowCloseDialog(false);
          }}
        />
      )}
    </div>
  );
}

async function injectIcon() {
  const { isShow, i18n: i18nResponse } = await (
    globalThis as unknown as {
      $onekey: {
        $private: {
          request: (
            arg: { method: string; params: { url: string } }
          ) => Promise<{
            isShow: boolean,
            i18n: i18nText
          }>
        }
      }
    }
  ).$onekey.$private.request({
    method: 'wallet_isShowFloatingButton',
    params: { url: window.location.origin },
  });
  i18n = i18nResponse;
  if (!isShow) {
    return;
  }

  if (isInjected) {
    return;
  }

  if (!document.body) {
    return;
  }
  isInjected = true;
  const div = document.createElement('div');
  document.body.appendChild(div);
  render(<App />, document.body, div);
}

export function injectFloatingButton() {
  (globalThis as unknown as {
    $onekey: {
      $private: {
        onNotifyFloatingIconChanged: (
          arg: ((params: { showFloatingIcon: boolean }) => void)
        ) => void
      }
    }
  }).$onekey.$private.onNotifyFloatingIconChanged(({ showFloatingIcon }: { showFloatingIcon: boolean }) => {
    if (showFloatingIcon) {
      void injectIcon();
    } else {
      removeIcon();
    }
  });
  void injectIcon();
}
