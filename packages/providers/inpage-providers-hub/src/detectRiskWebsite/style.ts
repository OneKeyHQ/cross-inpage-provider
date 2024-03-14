export const styleContent = `
.onekey-inject-font {
	font-family: ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;
	font-style: normal;
	letter-spacing: -0.32px;
	color: rgba(0, 0, 0, 0.88);
}
.onekey-inject-headingXl {
	/* headingXl */
	font-size: 20px;
	font-weight: 600;
	line-height: 28px; /* 140% */
	letter-spacing: 0.38px;
}
.onekey-inject-bodyLg {
	/* bodyLg */
	font-size: 16px;
	font-weight: 400;
	line-height: 24px; /* 150% */
}
.onekey-inject-bodyLg-medium {
	/* bodyLg-medium */
	font-size: 16px;
	font-weight: 500;
	line-height: 24px; /* 150% */
	color: rgba(255, 255, 255, 0.93);
}
.onekey-inject-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100%;
	padding: 20px;
	background-color: rgba(219, 0, 7, 0.72);
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	z-index: 100000;
	box-sizing: border-box;
}
.onekey-inject-modal-container {
	display: flex;
	max-width: 384px;
	flex-direction: column;
	align-items: flex-start;
	border-radius: 24px;
	border: 3px solid rgba(217, 0, 3, 0.32);
	background: #FFF;
	box-shadow: 0px 12px 24px 0px rgba(0, 0, 0, 0.09);
}
.onekey-inject-modal {
	display: flex;
	max-width: 384px;
	flex-direction: column;
	align-items: flex-start;
	border-radius: 24px;
	background: #FFF;
	padding: 20px 20px 0 16px;
}
.onekey-inject-error-icon {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 56px;
	height: 56px;
	padding: 12px;
	margin-right: 12px;
	border-radius: 9999px;
	background: rgba(255, 5, 5, 0.03);
	box-sizing: border-box;
}
.onekey-inject-error-icon-content {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="33" viewBox="0 0 32 33" fill="none"><path d="M17.3327 12.5254C17.3327 11.789 16.7357 11.1921 15.9993 11.1921C15.263 11.1921 14.666 11.789 14.666 12.5254V16.5177C14.666 17.2541 15.263 17.8511 15.9993 17.8511C16.7357 17.8511 17.3327 17.2541 17.3327 16.5177V12.5254Z" fill="%23BB0007" fill-opacity="0.836"/><path d="M15.9993 18.8332C15.0789 18.8332 14.3327 19.5794 14.3327 20.4998C14.3327 21.4203 15.0789 22.1665 15.9993 22.1665C16.9198 22.1665 17.666 21.4203 17.666 20.4998C17.666 19.5794 16.9198 18.8332 15.9993 18.8332Z" fill="%23BB0007" fill-opacity="0.836"/><path fill-rule="evenodd" clip-rule="evenodd" d="M19.4492 5.14869C17.9081 2.50577 14.0905 2.50578 12.5494 5.14869L3.21393 21.1589C1.66148 23.8213 3.5806 27.1665 6.66382 27.1665H25.3348C28.4181 27.1665 30.3372 23.8213 28.7847 21.1589L19.4492 5.14869ZM14.8531 6.49194C15.3653 5.61358 16.6334 5.61358 17.1456 6.49194L26.4811 22.5022C26.9979 23.3884 26.3583 24.4998 25.3348 24.4998H6.66382C5.64037 24.4998 5.00079 23.3884 5.51758 22.5022L14.8531 6.49194Z" fill="%23BB0007" fill-opacity="0.836"/></svg>');
  width: 32px; /* SVG width */
  height: 33px; /* SVG height */
  display: block;
}
.onekey-inject-error-icon > img {
	width: 32px;
	height: 32px;
	border-radius: 9999px;
}
.onekey-inject-title {
	display: flex;
	align-items: center;
}
.onekey-inject-risk-warning {
	margin-bottom: 20px;
}
.onekey-inject-text-wrap {
	margin: 0;
	margin-top: 20px;
}
.onekey-inject-text-subdued {
	margin: 0;
	color: rgba(0, 0, 0, 0.61);
}
.onekey-inject-list {
	padding-left: 20px;
	margin: 8px 0;
}
.onekey-inject-continue-link {
	text-decoration: underline;
	cursor: pointer;
}
.onekey-inject-continue-link:hover {
	color: rgba(0, 0, 0, 0.7);
}
.onekey-inject-continue-link:active {
	color: rgba(0, 0, 0, 0.5);
}
.onekey-inject-close-btn {
	display: flex;
	height: 38px;
	padding: 6px 14px;
	margin-bottom: 20px;
	justify-content: center;
	align-items: center;
	gap: 8px;
	align-self: stretch;
	border-radius: 8px;
	border: 1px solid rgba(170, 170, 170, 0);
	background: rgba(0, 0, 0, 0.88);
	color: rgba(255, 255, 255, 0.93);
	text-align: center;
	cursor: pointer;
}
.onekey-inject-close-btn:hover {
	background: rgba(0, 0, 0, 0.7);
}
.onekey-inject-close-btn:active {
	background: rgba(0, 0, 0, 0.5);
}
.onekey-inject-footer {
	display: flex;
	padding:16px 20px;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 8px;
	align-self: stretch;
	height: 56px;
	background: #F9F9F9;
	border-radius: 0 0 24px 24px;
	box-sizing: border-box;
	color: rgba(0, 0, 0, 0.61);
}
.onekey-inject-logo {
	display: flex;
	flex-direction: row;
	align-items: center;
	color: rgba(0, 0, 0, 0.88);
	font-weight: 600;
}
.onekey-inject-logo-content {
	width: 20px;
	height: 20px;
	margin-right: 6px;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='21' height='21' viewBox='0 0 21 21' fill='none'%3E%3Cpath d='M10.4987 14.4595C11.3758 14.4595 12.0867 13.7485 12.0867 12.8715C12.0867 11.9945 11.3758 11.2836 10.4987 11.2836C9.62174 11.2836 8.91078 11.9945 8.91078 12.8715C8.91078 13.7485 9.62174 14.4595 10.4987 14.4595Z' fill='black' fill-opacity='0.875'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M10.4987 19.6668C16.827 19.6668 19.6654 16.8284 19.6654 10.5002C19.6654 4.1719 16.827 1.3335 10.4987 1.3335C4.17044 1.3335 1.33203 4.1719 1.33203 10.5002C1.33203 16.8284 4.17044 19.6668 10.4987 19.6668ZM8.77681 5.22049H11.3269V9.42284H9.74582V6.57329H8.32942L8.77681 5.22049ZM10.4988 15.7798C12.105 15.7798 13.407 14.4778 13.407 12.8715C13.407 11.2653 12.105 9.96325 10.4988 9.96325C8.89255 9.96325 7.59046 11.2653 7.59046 12.8715C7.59046 14.4778 8.89255 15.7798 10.4988 15.7798Z' fill='black' fill-opacity='0.875'/%3E%3C/svg%3E");
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
	.onekey-inject-font {
		color: rgba(255, 255, 255, 0.93);
	}
	.onekey-inject-bodyLg-medium {
		color: rgba(0, 0, 0, 0.88);
	}
	.onekey-inject-bodyLg {
		color: rgba(255, 255, 255, 0.93);
	}
	.onekey-inject-modal-container {
		background: #1B1B1B;
	}
	.onekey-inject-modal {
		background: #1B1B1B;
	}
	.onekey-inject-footer {
		background: #1B1B1B;
	}
	.onekey-inject-error-icon {
		background: rgba(254, 0, 25, 0.07);
	}
	.onekey-inject-text-subdued {
		color: rgba(255, 255, 255, 0.66);
	}
	.onekey-inject-close-btn {
		border: 1px solid rgba(170, 170, 170, 0.00);
		background: rgba(255, 255, 255, 0.93);
	}
	.onekey-inject-close-btn:hover {
		background: rgba(255, 255, 255, 0.7);
	}
	.onekey-inject-close-btn:active {
		background: rgba(255, 255, 255, 0.5);
	}
	.onekey-inject-continue-link:hover {
		color: rgba(255, 255, 255, 0.7);
	}
	.onekey-inject-continue-link:active {
		color: rgba(255, 255, 255, 0.5);
	}
	.onekey-inject-footer {
		color: rgba(255, 255, 255, 0.66);
	}
	.onekey-inject-logo {
		color: rgba(255, 255, 255, 0.93);
	}
	.onekey-inject-error-icon-content {
		background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="33" viewBox="0 0 32 33" fill="none"><path d="M17.3327 12.5254C17.3327 11.789 16.7357 11.1921 15.9993 11.1921C15.263 11.1921 14.666 11.789 14.666 12.5254V16.5177C14.666 17.2541 15.263 17.8511 15.9993 17.8511C16.7357 17.8511 17.3327 17.2541 17.3327 16.5177V12.5254Z" fill="%23FF858A"/><path d="M15.9993 18.8332C15.0789 18.8332 14.3327 19.5794 14.3327 20.4998C14.3327 21.4203 15.0789 22.1665 15.9993 22.1665C16.9198 22.1665 17.666 21.4203 17.666 20.4998C17.666 19.5794 16.9198 18.8332 15.9993 18.8332Z" fill="%23FF858A"/><path fill-rule="evenodd" clip-rule="evenodd" d="M19.4492 5.14869C17.9081 2.50577 14.0905 2.50578 12.5494 5.14869L3.21393 21.1589C1.66148 23.8213 3.5806 27.1665 6.66382 27.1665H25.3348C28.4181 27.1665 30.3372 23.8213 28.7847 21.1589L19.4492 5.14869ZM14.8531 6.49194C15.3653 5.61358 16.6334 5.61358 17.1456 6.49194L26.4811 22.5022C26.9979 23.3884 26.3583 24.4998 25.3348 24.4998H6.66382C5.64037 24.4998 5.00079 23.3884 5.51758 22.5022L14.8531 6.49194Z" fill="%23FF858A"/></svg>');
	}
	.onekey-inject-logo-content {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='21' height='21' viewBox='0 0 21 21' fill='none'%3E%3Cpath d='M10.4987 14.4595C11.3758 14.4595 12.0867 13.7485 12.0867 12.8715C12.0867 11.9945 11.3758 11.2836 10.4987 11.2836C9.62174 11.2836 8.91078 11.9945 8.91078 12.8715C8.91078 13.7485 9.62174 14.4595 10.4987 14.4595Z' fill='white' fill-opacity='0.926'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M10.4987 19.6668C16.827 19.6668 19.6654 16.8284 19.6654 10.5002C19.6654 4.1719 16.827 1.3335 10.4987 1.3335C4.17044 1.3335 1.33203 4.1719 1.33203 10.5002C1.33203 16.8284 4.17044 19.6668 10.4987 19.6668ZM8.77681 5.22049H11.3269V9.42284H9.74582V6.57329H8.32942L8.77681 5.22049ZM10.4988 15.7798C12.105 15.7798 13.407 14.4778 13.407 12.8715C13.407 11.2653 12.105 9.96325 10.4988 9.96325C8.89255 9.96325 7.59046 11.2653 7.59046 12.8715C7.59046 14.4778 8.89255 15.7798 10.4988 15.7798Z' fill='white' fill-opacity='0.926'/%3E%3C/svg%3E");
	}
}
`;
