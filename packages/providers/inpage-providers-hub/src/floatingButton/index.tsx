import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  IHostSecurity,
  EHostSecurityLevel,
} from './type'

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
}

let i18n: i18nText = {} as i18nText

const logoStyle = {
  width: '28px',
  height: '28px',
};

const textStyle = {
  color: 'rgba(0, 0, 0, 0.61)',
  fontSize: '13px',
  marginLeft: '8px',
};

const containerId = 'onekey-floating-widget';

const useOutsideClick = (
  ref: { current?: HTMLDivElement | null },
  callback: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as HTMLElement)
      ) {
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
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 1)',
        padding: '14px',
        position: 'absolute',
        right: '134px',
        border: '1px rgba(0, 0, 0, 0.13) solid',
        top: '60px',
        width: '170px',
        borderRadius: '15px',
      }}
      ref={dialogRef}
    >
      <div
        style={{
          color: 'rgba(0, 0, 0, 1)',
          fontSize: '12px',
          fontWeight: '400',
        }}
      >
        Hide on this site
      </div>
      <div
        style={{
          marginTop: '4px',
          marginBottom: '8px',
          color: 'rgba(0, 0, 0, 1)',
          fontSize: '12px',
          fontWeight: '400',
        }}
      >
        Disable
      </div>
      <div
        style={{
          color: 'rgb(156, 156, 156)',
          fontSize: '10px',
          fontWeight: '400',
        }}
      >
        Can be re-enabled in settings.
      </div>
    </div>
  );
}

function IconButton({
  isExpanded,
  onClick,
  dataLoaded,
}: {
  isExpanded: boolean;
  onClick: () => void;
  dataLoaded: boolean;
}) {
  const [showCloseButton, setIsShowCloseButton] = useState(false);
  const [showCloseDialog, setIsShowCloseDialog] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '184px',
        position: 'relative',
        cursor: 'pointer',
        padding: '8px',
      }}
      onMouseEnter={() => {
        if (isExpanded || showCloseDialog) {
          return;
        }
        setIsShowCloseButton(true);
      }}
      onMouseLeave={() => setIsShowCloseButton(false)}
      onClick={() => {
        if (showCloseDialog) {
          return;
        }
        setIsShowCloseButton(false);
        onClick();
      }}
    >
      <img
        src="https://asset.onekey-asset.com/app-monorepo/bb7a4e71aba56b405faf9278776d57d73b829708/favicon.png"
        style={logoStyle}
      />
      {!dataLoaded && (
        <span style={textStyle}>
          {isExpanded ? 'Fetching dApp info...' : ''}
        </span>
      )}
      <div
        style={{
          position: 'absolute',
          left: '0px',
          bottom: '-10px',
          opacity: showCloseButton ? 1 : 0,
        }}
        onClick={(event) => {
          event.stopPropagation();
          setIsShowCloseButton(false);
          setIsShowCloseDialog(true);
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.5 1.5C3.73858 1.5 1.5 3.73858 1.5 6.5C1.5 9.26142 3.73858 11.5 6.5 11.5C9.26142 11.5 11.5 9.26142 11.5 6.5C11.5 3.73858 9.26142 1.5 6.5 1.5ZM0.25 6.5C0.25 3.04822 3.04822 0.25 6.5 0.25C9.95178 0.25 12.75 3.04822 12.75 6.5C12.75 9.95178 9.95178 12.75 6.5 12.75C3.04822 12.75 0.25 9.95178 0.25 6.5ZM4.18306 4.18306C4.42714 3.93898 4.82286 3.93898 5.06694 4.18306L6.5 5.61612L7.93306 4.18306C8.17714 3.93898 8.57286 3.93898 8.81694 4.18306C9.06102 4.42714 9.06102 4.82286 8.81694 5.06694L7.38388 6.5L8.81694 7.93306C9.06102 8.17714 9.06102 8.57286 8.81694 8.81694C8.57286 9.06102 8.17714 9.06102 7.93306 8.81694L6.5 7.38388L5.06694 8.81694C4.82286 9.06102 4.42714 9.06102 4.18306 8.81694C3.93898 8.57286 3.93898 8.17714 4.18306 7.93306L5.61612 6.5L4.18306 5.06694C3.93898 4.82286 3.93898 4.42714 4.18306 4.18306Z"
            fill="#C8C8C8"
          />
        </svg>
      </div>
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

function SecurityInfoRow({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <div
      style={{
        display: 'flex',
        height: '16px',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px',
      }}
    >
      <span
        style={{
          color: 'rgba(0, 0, 0, 0.61)',
          fontWeight: '500',
          fontSize: '11.2px',
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

function SecurityRiskDetectionRow({
  securityInfo,
}: {
  securityInfo: IHostSecurity;
}) {
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
                fontSize: '11.2px',
              }}
            >
              {i18n.verifiedSite}
            </span>
            <svg
              width="13"
              height="14"
              viewBox="0 0 13 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.7827 2.03938C6.21439 1.54254 6.98582 1.54254 7.41751 2.03938L8.14191 2.87311C8.14557 2.87733 8.15115 2.87935 8.15666 2.87848L9.2475 2.70544C9.89755 2.60232 10.4885 3.09819 10.4998 3.75627L10.5188 4.86059C10.5189 4.86617 10.5219 4.8713 10.5267 4.87418L11.4735 5.4428C12.0378 5.78165 12.1718 6.54136 11.7574 7.05277L11.0622 7.91094C11.0586 7.91528 11.0576 7.92112 11.0594 7.9264L11.4193 8.97061C11.6337 9.59289 11.248 10.261 10.6019 10.3864L9.51762 10.5969C9.51214 10.5979 9.5076 10.6018 9.5056 10.607L9.11004 11.6382C8.87432 12.2527 8.14941 12.5166 7.57382 12.1973L6.60796 11.6616C6.60307 11.6589 6.59714 11.6589 6.59226 11.6616L5.62639 12.1973C5.05081 12.5166 4.3259 12.2527 4.09017 11.6382L3.69462 10.607C3.69262 10.6018 3.68807 10.5979 3.68259 10.5969L2.59836 10.3864C1.95224 10.261 1.56652 9.59289 1.78095 8.97061L2.14079 7.9264C2.14261 7.92112 2.14158 7.91528 2.13806 7.91094L1.44279 7.05277C1.02846 6.54137 1.16241 5.78165 1.72667 5.4428L2.67353 4.87418C2.67831 4.8713 2.68128 4.86617 2.68137 4.86059L2.70038 3.75628C2.71171 3.09819 3.30266 2.60232 3.95272 2.70544L5.04355 2.87848C5.04907 2.87935 5.05464 2.87733 5.0583 2.87311L5.7827 2.03938ZM8.31057 6.5772C8.51885 6.36893 8.51885 6.03124 8.31057 5.82296C8.10229 5.61468 7.76461 5.61468 7.55633 5.82296L6.06678 7.3125L5.6439 6.88962C5.43562 6.68134 5.09794 6.68134 4.88966 6.88962C4.68138 7.0979 4.68138 7.43559 4.88966 7.64387L5.5011 8.25531C5.81352 8.56773 6.32005 8.56773 6.63247 8.25531L8.31057 6.5772Z"
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
                fontSize: '11.2px',
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
        .filter((item) =>
          EHostSecurityLevel.Medium == item.riskLevel,
        )
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
                fontSize: '11.2px',
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
            fontSize: '11.2px',
          }}
        >
          {i18n.unknown}
        </span>
      ),
    };
  }, [securityInfo?.checkSources]);
  return (
    <SecurityInfoRow title="Risk Detection">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3.2px',
        }}
      >
        {securityElement}
        <svg
          width="13"
          height="14"
          viewBox="0 0 13 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.15621 4.48971C5.36449 4.28143 5.70218 4.28143 5.91046 4.48971L7.66667 6.24592C8.08323 6.66247 8.08323 7.33785 7.66667 7.75441L5.91046 9.51062C5.70218 9.7189 5.36449 9.7189 5.15621 9.51062C4.94793 9.30234 4.94793 8.96465 5.15621 8.75637L6.91242 7.00016L5.15621 5.24395C4.94793 5.03567 4.94793 4.69799 5.15621 4.48971Z"
            fill="#006B3B"
            fillOpacity="0.906"
          />
        </svg>
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
        width: '234px',
        borderTopLeftRadius: '12px',
        borderBottomLeftRadius: '12px',
        paddingTop: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(0, 0, 0, 0.88)',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {securityInfo?.dapp?.logo ? (
              <img
                src={securityInfo?.dapp?.logo}
                style={{
                  height: '24px',
                  width: '24px',
                  borderRadius: '4px',
                }}
              />
            ) : (
              <svg
                width="18"
                height="19"
                viewBox="0 0 18 19"
                fill="none"
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
            {securityInfo?.dapp?.name || securityInfo?.host}
          </div>
          <div
            style={{
              width: "24",
              height: "24",
              cursor: "pointer"
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289Z"
                fill="#BABABA"
              />
            </svg>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.13)',
            height: '0.33px',
            width: '100%',
          }}
        />
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
          <SecurityInfoRow title="Last Verified at">
            <span
              style={{
                fontWeight: '500',
                fontSize: '11.2px',
                color: 'rgba(0, 0, 0, 0.88)',
              }}
            >
              {securityInfo.updatedAt}
            </span>
          </SecurityInfoRow>
        ) : null}
      </div>
      <div
        style={{
          marginTop: '8px',
          textAlign: 'center',
          padding: '8px 0',
          background: 'rgba(249, 249, 249, 1)',
          borderBottomLeftRadius: '12px',
        }}
      >
        <span
          style={{
            color: 'rgba(0, 0, 0, 0.61)',
            fontWeight: '400',
            fontSize: '11.2px',
          }}
        >
          Powered by
        </span>
        <img
          src="https://asset.onekey-asset.com/app-monorepo/bb7a4e71aba56b405faf9278776d57d73b829708/favicon.png"
          style={{
            width: '12.83px',
            height: '12.83px',
            marginLeft: '5.6px',
            marginRight: '4.2px',
            verticalAlign: 'middle',
          }}
        />
        <span
          style={{
            color: 'rgba(0, 0, 0, 0.88)',
            fontWeight: '600',
            fontSize: '11.2px',
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

  const handleClick = async () => {
    setIsExpanded(!isExpanded);
    setIsShowSecurityInfo(true);
    if (!securityInfo) {
      const result = await (window as unknown as {
        $onekey: {
          $private: {
            request: (arg: { method: string; params: { url: string } }) =>
              Promise<{ securityInfo: IHostSecurity }>
          }
        }
      }).$onekey.$private.request({
        method: 'wallet_detectRiskLevel',
        params: { url: window.location.origin },
      });
      setSecurityInfo(result.securityInfo);
    }
  };

  const borderStyle = useMemo(
    () =>
      isExpanded
        ? {
          borderTopLeftRadius: '12px',
          borderBottomLeftRadius: '12px',
          borderTopRightRadius: '0px',
          borderBottomRightRadius: '0px',
        }
        : {
          boxShadow: '0px 8.57px 17.14px 0px rgba(0, 0, 0, 0.09)',
          transition: 'transform 0.3s ease-in-out',
          borderRadius: '100px',
        },
    [isExpanded],
  );

  return (
    <div
      id={containerId}
      style={{
        position: 'fixed',
        zIndex: 999_999,
        top: '20%',
        right: '-146px',
        background: 'rgba(255, 255, 255, 1)',
        borderWidth: '0.33px',
        borderColor: 'rgba(0, 0, 0, 0.13)',
        borderStyle: 'solid',
        boxShadow: '0px 8.57px 17.14px 0px rgba(0, 0, 0, 0.09)',
        transition: 'transform 0.3s ease-in-out',
        transform: isExpanded ? 'translateX(-146px)' : 'translateX(0)',
        ...borderStyle,
      }}
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
          dataLoaded={!!securityInfo}
        />
      )}
    </div>
  );
}

export async function injectFloatingButton() {
  const { isShow, i18n: i18nResponse } = await (globalThis as unknown as {
    $onekey: {
      $private: {
        request: (
          arg: { method: string; }
        ) => Promise<{
          isShow: boolean,
          i18n: i18nText
        }>
      }
    }
  }).$onekey.$private.request({
    method: 'wallet_isShowFloatingButton',
  });
  i18n = i18nResponse
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
