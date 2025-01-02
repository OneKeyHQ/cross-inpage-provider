import { render } from 'preact';
import { useEffect, useMemo, useCallback, useRef, useState } from 'preact/hooks';
import { IHostSecurity, EHostSecurityLevel } from './type';
import { HighRisk, Logo, MediumRsik, Image } from './images';

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

        <div>
          <div>{i18n.disable}</div>
          <div
            style={{
              color: 'rgba(0, 0, 0, 0.61)',
              fontSize: '12px',
              lineHeight: '16px',
            }}
            >
            {i18n.canBeReEnabledInSettings}
          </div>
        </div>
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

const SECURITY_INFO = {
  [EHostSecurityLevel.Security]: {
    titleId: 'verifiedSite',
    icon: (
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
    ),
  },
  [EHostSecurityLevel.High]: {
    titleId: 'maliciousSiteWarning',
    icon: (
      <HighRisk style={{ width: 16, height: 16}} />
    ),
  },
  [EHostSecurityLevel.Medium]: {
    titleId: 'suspectedMaliciousBehavior',
    icon: (
      <MediumRsik style={{ width: 16, height: 16}} />
    ),
  },
};

function SecurityRiskDetectionRow({ securityInfo }: { securityInfo: IHostSecurity }) {
  const { securityElement, securityStatus } = useMemo(() => {
    if (securityInfo.level === EHostSecurityLevel.Unknown) {
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
      }
    }

    const securityInfoItem = securityInfo?.level ? SECURITY_INFO[securityInfo.level] as unknown as {
      titleId: string;
      icon: string;
    } : undefined
    return {
      securityStatus: securityInfo.level,
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
            {securityInfoItem ? i18n[securityInfoItem.titleId as keyof typeof i18n] : i18n.unknown}
          </span>
          {securityInfoItem ? securityInfoItem.icon : null}
        </>
      )
    }
  }, [securityInfo]);
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
}: {
  securityInfo: IHostSecurity;
  onClose: () => void;
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
              <Image
                src={securityInfo?.dapp?.logo}
                style={{
                  height: '24px',
                  width: '24px',
                  borderRadius: '8px',
                }}
              />
            ) : (
              <div 
                style={{ 
                  height: '16px', 
                  width: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10Z" fill="black" fill-opacity="0.447"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M10 7C9.62267 7 9.29263 7.2086 9.12147 7.52152C8.85645 8.00606 8.24881 8.18401 7.76426 7.91899C7.27972 7.65396 7.10177 7.04632 7.36679 6.56178C7.87463 5.63331 8.86263 5 10 5C11.5147 5 12.5669 6.00643 12.8664 7.189C13.1676 8.37786 12.7101 9.76299 11.3416 10.4472C11.1323 10.5519 11 10.7659 11 11C11 11.5523 10.5523 12 10 12C9.44772 12 9 11.5523 9 11C9 10.0084 9.56027 9.10183 10.4472 8.65836C10.902 8.43099 11.0188 8.03973 10.9277 7.6801C10.835 7.31417 10.5283 7 10 7Z" fill="black" fill-opacity="0.447"/>
                  <path d="M11 14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14C9 13.4477 9.44772 13 10 13C10.5523 13 11 13.4477 11 14Z" fill="black" fill-opacity="0.447"/>
                </svg>
              </div>
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
            onClick={onClose}
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
                  <Image
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
          {i18n.maliciousDappWarningSourceMessage}
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
  const [position, setPosition] = useState({ x: window.innerWidth - 40, y: window.innerHeight * 0.75 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [side, setSide] = useState<'left'|'right'>('right');
  const isDraggingTimerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleShowCloseDialog = useCallback(() => {
    setIsShowCloseDialog(true);
  }, []);

  const handleClick = useCallback(async () => {
    if (!isDragging) {
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
    }
  }, [isExpanded, securityInfo, isDragging]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    isDraggingTimerIdRef.current = setTimeout(() => {
      setIsDragging(true);
      setIsExpanded(false);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, 200)
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.min(Math.max(e.clientX - startPos.x, 0), window.innerWidth - 40);
      const newY = Math.min(Math.max(e.clientY - startPos.y, 0), window.innerHeight - 100);
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, startPos]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingTimerIdRef.current) {
      clearTimeout(isDraggingTimerIdRef.current)
    }
    if (isDragging) {
      setIsDragging(false);
      const halfWidth = window.innerWidth / 2;
      if (position.x < halfWidth) {
        setPosition(prev => ({ ...prev, x: 0 }));
        setSide('left');
      } else {
        setPosition(prev => ({ ...prev, x: window.innerWidth - 40 }));
        setSide('right');
      }
    }
  }, [isDragging, position.x]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      id={containerId}
      style={{
        position: 'fixed',
        zIndex: 999_999,
        top: position.y,
        left: isDragging ? position.x : (side === 'left' ? '0px' : 'auto'),
        right: isDragging ? 'auto' : (side === 'right' ? '0px' : 'auto'),
        width: '256px',
        background: '#fff',
        borderRadius: '12px',
        transition: isDragging ? 'none' : 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow:
          '0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        transform: isExpanded ? 
          `translateX(${side === 'right' ? '-20px' : '20px'})` : 
          `translateX(${side === 'right' ? '216px' : '-216px'})`,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        WebkitTextSizeAdjust: '100%',
        fontSmooth: 'antialiased',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {showSecurityInfo && securityInfo ? (
        <SecurityInfo
          securityInfo={securityInfo}
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
  // Check if the current window is an iframe
  if (window.top !== window.self) {
    return
  }
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
