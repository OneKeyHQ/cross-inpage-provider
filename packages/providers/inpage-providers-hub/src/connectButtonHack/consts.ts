enum WALLET_NAMES {
  metamask = 'metamask',
  phantom = 'phantom',
  onekey = 'onekey',
}

export const WALLET_CONNECT_INFO: Record<
  WALLET_NAMES,
  {
    iconUrl: string;
    icon: string;
    text: string;
  }
> = {
  onekey: {
    iconUrl: '',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQ5IiBoZWlnaHQ9IjQ0OSIgdmlld0JveD0iMCAwIDQ0OSA0NDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00NDkgMjI0LjVDNDQ5IDM3OS40ODUgMzc5LjQ4NSA0NDkgMjI0LjUgNDQ5QzY5LjUxNTEgNDQ5IDAgMzc5LjQ4NSAwIDIyNC41QzAgNjkuNTE1MSA2OS41MTUxIDAgMjI0LjUgMEMzNzkuNDg1IDAgNDQ5IDY5LjUxNTEgNDQ5IDIyNC41WiIgZmlsbD0iIzAwQjgxMiIvPgo8cGF0aCBkPSJNMjQ0Ljc4NCA5NS4xOTU4TDE4Mi4zMjkgOTUuMTk1OEwxNzEuMzcyIDEyOC4zMjdIMjA2LjA2MVYxOTguMTE1SDI0NC43ODRWOTUuMTk1OFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjk1LjcyOCAyODIuNTc3QzI5NS43MjggMzIxLjkxNSAyNjMuODM5IDM1My44MDQgMjI0LjUwMSAzNTMuODA0QzE4NS4xNjQgMzUzLjgwNCAxNTMuMjc1IDMyMS45MTUgMTUzLjI3NSAyODIuNTc3QzE1My4yNzUgMjQzLjI0IDE4NS4xNjQgMjExLjM1IDIyNC41MDEgMjExLjM1QzI2My44MzkgMjExLjM1IDI5NS43MjggMjQzLjI0IDI5NS43MjggMjgyLjU3N1pNMjYzLjM5MiAyODIuNTc3QzI2My4zOTIgMzA0LjA1NiAyNDUuOTggMzIxLjQ2OCAyMjQuNTAxIDMyMS40NjhDMjAzLjAyMiAzMjEuNDY4IDE4NS42MTEgMzA0LjA1NiAxODUuNjExIDI4Mi41NzdDMTg1LjYxMSAyNjEuMDk4IDIwMy4wMjIgMjQzLjY4NiAyMjQuNTAxIDI0My42ODZDMjQ1Ljk4IDI0My42ODYgMjYzLjM5MiAyNjEuMDk4IDI2My4zOTIgMjgyLjU3N1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    text: 'OneKey',
  },
  metamask: {
    iconUrl: 'https://common.onekey-asset.com/logo/metamask-onekey.png',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPG1hc2sgaWQ9Im1hc2swXzg5MjRfNTIwMzgiIHN0eWxlPSJtYXNrLXR5cGU6YWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjMiIHk9IjMiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CjxwYXRoIGQ9Ik0zIDNINTNMMjggMjhMMyA1M1YzWiIgZmlsbD0iI0Q5RDlEOSIvPgo8L21hc2s+CjxnIG1hc2s9InVybCgjbWFzazBfODkyNF81MjAzOCkiPgo8L2c+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjEzLjMzMzMiIGZpbGw9IndoaXRlIi8+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF84OTI0XzUyMDM4KSI+CjxwYXRoIGQ9Ik0zMi4yODU0IDcuNjgzMTFMMjEuODQzOCAxNS40MDdMMjMuNzkwNiAxMC44NTM3TDMyLjI4NTQgNy42ODMxMVoiIGZpbGw9IiNFMTc3MjYiIHN0cm9rZT0iI0UxNzcyNiIgc3Ryb2tlLXdpZHRoPSIwLjE5ODY2MSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik04LjIxMDAyIDcuNjgzMTFMMTguNTU2MyAxNS40NzA2TDE2LjcwNDggMTAuODYxN0w4LjIxMDAyIDcuNjgzMTFaTTI4LjUyOSAyNS41ODY0TDI1Ljc0NzggMjkuODI5OEwzMS42OTk3IDMxLjQ2NjhMMzMuNDAwMiAyNS42ODE4TDI4LjUyOSAyNS41ODY0Wk03LjEwNTQ3IDI1LjY4MThMOC43OTgwNiAzMS40NjY4TDE0LjczNCAyOS44Mjk4TDExLjk2ODcgMjUuNTg2NEw3LjEwNTQ3IDI1LjY4MThaIiBmaWxsPSIjRTI3NjI1IiBzdHJva2U9IiNFMjc2MjUiIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTQuNDE0NiAxOC40MTg0TDEyLjc2MTcgMjAuOTEzNkwxOC42NDIxIDIxLjE4MzhMMTguNDUxNCAxNC44NTA1TDE0LjQxNDYgMTguNDI2NFYxOC40MTg0Wk0yNi4wNzk5IDE4LjQyNjRMMjEuOTc5NiAxNC43NzFMMjEuODQ0NSAyMS4xODM4TDI3LjcyNDggMjAuOTEzNkwyNi4wNzk5IDE4LjQyNjRaTTE0LjczMjQgMjkuODI5NUwxOC4zMDA0IDI4LjExM0wxNS4yMzMxIDI1LjcyOTFMMTQuNzMyNCAyOS44Mjk1Wk0yMi4yMDIxIDI4LjEwNTFMMjUuNzQ2MiAyOS44Mjk1TDI1LjI2OTQgMjUuNzIxMkwyMi4yMDIxIDI4LjEwNTFaIiBmaWxsPSIjRTI3NjI1IiBzdHJva2U9IiNFMjc2MjUiIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjUuNzQ0MiAyOS44M0wyMi4yMDAxIDI4LjExMzVMMjIuNDg2MiAzMC40MThMMjIuNDU0NCAzMS4zOTU0TDI1Ljc0NDIgMjkuODNaTTE0LjczMDUgMjkuODNMMTguMDM2MiAzMS4zOTU0TDE4LjAxMjMgMzAuNDE4TDE4LjI5ODQgMjguMTEzNUwxNC43MzA1IDI5LjgzWiIgZmlsbD0iI0Q1QkZCMiIgc3Ryb2tlPSIjRDVCRkIyIiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTE4LjA5MjUgMjQuMTk1N0wxNS4xNTIzIDIzLjMzNzVMMTcuMjM0MyAyMi4zODM5TDE4LjEwMDUgMjQuMTk1N0gxOC4wOTI1Wk0yMi4zOTE1IDI0LjE5NTdMMjMuMjY1NiAyMi4zNzZMMjUuMzU1NiAyMy4zMjk1TDIyLjM5MTUgMjQuMjAzN1YyNC4xOTU3WiIgZmlsbD0iIzIzMzQ0NyIgc3Ryb2tlPSIjMjMzNDQ3IiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTE0LjczMDIgMjkuODI5NUwxNS4yNDY3IDI1LjU4NjFMMTEuOTY0OCAyNS42ODE0TDE0LjczMDIgMjkuODI5NVpNMjUuMjQzMyAyNS41ODYxTDI1Ljc0MzkgMjkuODI5NUwyOC41MjUyIDI1LjY4MTRMMjUuMjQzMyAyNS41ODYxWk0yNy43MzA2IDIwLjkxMzZMMjEuODUwMiAyMS4xODM4TDIyLjM5MDYgMjQuMjAzNEwyMy4yNjQ3IDIyLjM3NTdMMjUuMzU0NiAyMy4zMjkzTDI3LjczMDYgMjAuOTEzNlpNMTUuMTUxNCAyMy4zMzcyTDE3LjIzMzMgMjIuMzgzN0wxOC4wOTk1IDI0LjE5NTRMMTguNjQ3OCAyMS4xNzU4TDEyLjc2NzQgMjAuOTEzNkwxNS4xNTE0IDIzLjMzNzJaIiBmaWxsPSIjQ0M2MjI4IiBzdHJva2U9IiNDQzYyMjgiIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTIuNzY5NSAyMC45MTM2TDE1LjIzMjkgMjUuNzIxMkwxNS4xNTM1IDIzLjMzNzJMMTIuNzY5NSAyMC45MTM2Wk0yNS4zNTY3IDIzLjMzNzJMMjUuMjYxMyAyNS43MjEyTDI3LjcyNDcgMjAuOTEzNkwyNS4zNTY3IDIzLjMzNzJaTTE4LjY0OTkgMjEuMTgzOEwxOC4wOTM2IDI0LjIwMzRMMTguNzkyOSAyNy43NjM0TDE4Ljk1MTkgMjMuMDY3MUwxOC42NDk5IDIxLjE4MzhaTTIxLjg0NDQgMjEuMTgzOEwyMS41NTgzIDIzLjA1OTFMMjEuNzAxMyAyNy43NjM0TDIyLjM5MjcgMjQuMTk1NEwyMS44NDQ0IDIxLjE3NThWMjEuMTgzOFoiIGZpbGw9IiNFMjc1MjUiIHN0cm9rZT0iI0UyNzUyNSIgc3Ryb2tlLXdpZHRoPSIwLjE5ODY2MSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yMi4zOTE3IDI0LjE5NTZMMjEuNzAwMyAyNy43NjM2TDIyLjIwMSAyOC4xMTMyTDI1LjI2MDMgMjUuNzI5M0wyNS4zNTU3IDIzLjMzNzRMMjIuMzkxNyAyNC4xOTU2Wk0xNS4xNTI1IDIzLjMzNzRMMTUuMjMxOSAyNS43MjEzTDE4LjI5OTMgMjguMTA1M0wxOC43OTE5IDI3Ljc2MzZMMTguMTAwNiAyNC4xOTU2TDE1LjE0NDUgMjMuMzM3NEgxNS4xNTI1WiIgZmlsbD0iI0Y1ODQxRiIgc3Ryb2tlPSIjRjU4NDFGIiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTIyLjQ2MjMgMzEuMzk1M0wyMi40ODYyIDMwLjQxNzlMMjIuMjE2IDMwLjE5NTRIMTguMjc0NkwxOC4wMTIzIDMwLjQxNzlMMTguMDM2MiAzMS4zOTUzTDE0LjczMDUgMjkuODI5OEwxNS44OTA2IDMwLjc4MzRMMTguMjM0OCAzMi4zOTY1SDIyLjI0NzhMMjQuNTk5OSAzMC43NzU1TDI1Ljc0NDIgMjkuODI5OEwyMi40NTQ0IDMxLjM5NTNIMjIuNDYyM1oiIGZpbGw9IiNDMEFDOUQiIHN0cm9rZT0iI0MwQUM5RCIgc3Ryb2tlLXdpZHRoPSIwLjE5ODY2MSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yMi4xOTk1IDI4LjEwNTRMMjEuNjk4OSAyNy43NjM3SDE4Ljc5MDVMMTguMjk3OCAyOC4xMTMzTDE4LjAxMTcgMzAuNDE3OEwxOC4yNzQgMzAuMTk1M0gyMi4yMTU0TDIyLjQ4NTYgMzAuNDE3OEwyMi4xOTk1IDI4LjExMzNWMjguMTA1NFoiIGZpbGw9IiMxNjE2MTYiIHN0cm9rZT0iIzE2MTYxNiIgc3Ryb2tlLXdpZHRoPSIwLjE5ODY2MSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0zMi43MzI0IDE1LjkwNzdMMzMuNjA2NSAxMS42NTYzTDMyLjI4NzQgNy42ODMxMUwyMi4xOTU0IDE1LjE1MjdMMjYuMDgxMiAxOC40MTg3TDMxLjU2NDMgMjAuMDE2TDMyLjc3MjEgMTguNjA5NEwzMi4yNDc3IDE4LjIyOEwzMy4wODIxIDE3LjQ2NTJMMzIuNDQ2MyAxNi45NzI1TDMzLjI4MDcgMTYuMzM2OEwzMi43MjQ1IDE1LjkwNzdIMzIuNzMyNFpNNi44OTA2MiAxMS42NDg0TDcuNzgwNjIgMTUuOTA3N0w3LjIwODQ4IDE2LjMyODhMOC4wNTg3NSAxNi45NjQ1TDcuNDIzMDQgMTcuNDY1Mkw4LjI0OTQ2IDE4LjIyOEw3LjcyNSAxOC42MDk0TDguOTMyODYgMjAuMDE2TDE0LjQxNTkgMTguNDI2N0wxOC4zMDE3IDE1LjE0NDhMOC4yMDk3MyA3LjY4MzExTDYuODkwNjIgMTEuNjQ4NFoiIGZpbGw9IiM3NjNFMUEiIHN0cm9rZT0iIzc2M0UxQSIgc3Ryb2tlLXdpZHRoPSIwLjE5ODY2MSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0zMS41NjQ2IDIwLjAxNkwyNi4wODE1IDE4LjQyNjdMMjcuNzM0NCAyMC45MTM5TDI1LjI3MSAyNS43MjE1TDI4LjUyOSAyNS42ODE4SDMzLjQwMDJMMzEuNTY0NiAyMC4wMTZaTTE0LjQxNjIgMTguNDE4OEw4LjkzMzE1IDIwLjAxNkw3LjEwNTQ3IDI1LjY4MThIMTEuOTc2NkwxNS4yMzQ3IDI1LjcyMTVMMTIuNzcxMyAyMC45MTM5TDE0LjQyNDEgMTguNDE4OEgxNC40MTYyWk0yMS44NDYxIDIxLjE4NDFMMjIuMjAzNyAxNS4xNDQ4TDIzLjc5MyAxMC44NTM4SDE2LjcwNDhMMTguMjk0IDE1LjE0NDhMMTguNjUxNiAyMS4xODQxTDE4Ljc4NjcgMjMuMDc1NFYyNy43NjM4SDIxLjcwMzFMMjEuNzE5IDIzLjA3NTRMMjEuODQ2MSAyMS4xODQxWiIgZmlsbD0iI0Y1ODQxRiIgc3Ryb2tlPSIjRjU4NDFGIiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9nPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTM2IDU2QzQ5LjgwNzEgNTYgNTYgNDkuODA3MSA1NiAzNkM1NiAyMi4xOTI5IDQ5LjgwNzEgMTYgMzYgMTZDMjIuMTkyOSAxNiAxNiAyMi4xOTI5IDE2IDM2QzE2IDQ5LjgwNzEgMjIuMTkyOSA1NiAzNiA1NlpNMzIuMjQyOSAyNC40ODA2SDM3LjgwNjhWMzMuNjQ5NEgzNC4zNTcxVjI3LjQzMjJIMzEuMjY2OEwzMi4yNDI5IDI0LjQ4MDZaTTM1Ljk5OTkgNDcuNTE5MkMzOS41MDQzIDQ3LjUxOTIgNDIuMzQ1MiA0NC42NzgzIDQyLjM0NTIgNDEuMTczOEM0Mi4zNDUyIDM3LjY2OTQgMzkuNTA0MyAzNC44Mjg1IDM1Ljk5OTkgMzQuODI4NUMzMi40OTU0IDM0LjgyODUgMjkuNjU0NSAzNy42Njk0IDI5LjY1NDUgNDEuMTczOEMyOS42NTQ1IDQ0LjY3ODMgMzIuNDk1NCA0Ny41MTkyIDM1Ljk5OTkgNDcuNTE5MlpNMzUuOTk5OSA0NC42Mzg1QzM3LjkxMzMgNDQuNjM4NSAzOS40NjQ1IDQzLjA4NzMgMzkuNDY0NSA0MS4xNzM4QzM5LjQ2NDUgMzkuMjYwNCAzNy45MTMzIDM3LjcwOTIgMzUuOTk5OSAzNy43MDkyQzM0LjA4NjQgMzcuNzA5MiAzMi41MzUyIDM5LjI2MDQgMzIuNTM1MiA0MS4xNzM4QzMyLjUzNTIgNDMuMDg3MyAzNC4wODY0IDQ0LjYzODUgMzUuOTk5OSA0NC42Mzg1WiIgZmlsbD0iIzAwQjgxMiIvPgo8cGF0aCBkPSJNMzcuODA4NSAyNC40ODA3SDMyLjI0NDZMMzEuMjY4NSAyNy40MzIzSDM0LjM1ODlWMzMuNjQ5NUgzNy44MDg1VjI0LjQ4MDdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQyLjM0NyA0MS4xNzM5QzQyLjM0NyA0NC42Nzg0IDM5LjUwNjEgNDcuNTE5MyAzNi4wMDE2IDQ3LjUxOTNDMzIuNDk3MiA0Ny41MTkzIDI5LjY1NjMgNDQuNjc4NCAyOS42NTYzIDQxLjE3MzlDMjkuNjU2MyAzNy42Njk1IDMyLjQ5NzIgMzQuODI4NiAzNi4wMDE2IDM0LjgyODZDMzkuNTA2MSAzNC44Mjg2IDQyLjM0NyAzNy42Njk1IDQyLjM0NyA0MS4xNzM5Wk0zOS40NjYyIDQxLjE3MzlDMzkuNDY2MiA0My4wODc0IDM3LjkxNTEgNDQuNjM4NiAzNi4wMDE2IDQ0LjYzODZDMzQuMDg4MSA0NC42Mzg2IDMyLjUzNjkgNDMuMDg3NCAzMi41MzY5IDQxLjE3MzlDMzIuNTM2OSAzOS4yNjA0IDM0LjA4ODEgMzcuNzA5MyAzNi4wMDE2IDM3LjcwOTNDMzcuOTE1MSAzNy43MDkzIDM5LjQ2NjIgMzkuMjYwNCAzOS40NjYyIDQxLjE3MzlaIiBmaWxsPSJ3aGl0ZSIvPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF84OTI0XzUyMDM4Ij4KPHJlY3Qgd2lkdGg9IjI3LjgxMjUiIGhlaWdodD0iMjYuMjIzMiIgZmlsbD0id2hpdGUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYuMDkzNzUgNi44ODgxOCkiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K',
    text: 'OneKey & MetaMask',
  },
  phantom: {
    iconUrl: 'https://common.onekey-asset.com/logo/phantom-onekey.png',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzg5MjRfNTIwMzkpIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAxXzg5MjRfNTIwMzkpIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMTMuMzMzMyIgZmlsbD0id2hpdGUiLz4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAyXzg5MjRfNTIwMzkpIj4KPHBhdGggZD0iTTMyLjI4NTQgNy42ODMxMUwyMS44NDM4IDE1LjQwN0wyMy43OTA2IDEwLjg1MzdMMzIuMjg1NCA3LjY4MzExWiIgZmlsbD0iI0UxNzcyNiIgc3Ryb2tlPSIjRTE3NzI2IiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTguMjEwMDIgNy42ODMxMUwxOC41NTYzIDE1LjQ3MDZMMTYuNzA0OCAxMC44NjE3TDguMjEwMDIgNy42ODMxMVpNMjguNTI5IDI1LjU4NjRMMjUuNzQ3OCAyOS44Mjk4TDMxLjY5OTcgMzEuNDY2OEwzMy40MDAyIDI1LjY4MThMMjguNTI5IDI1LjU4NjRWMjUuNTg2NFpNNy4xMDU0NyAyNS42ODE4TDguNzk4MDYgMzEuNDY2OEwxNC43MzQgMjkuODI5OEwxMS45Njg3IDI1LjU4NjRMNy4xMDU0NyAyNS42ODE4VjI1LjY4MThaIiBmaWxsPSIjRTI3NjI1IiBzdHJva2U9IiNFMjc2MjUiIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTQuNDE0NiAxOC40MTg0TDEyLjc2MTcgMjAuOTEzNkwxOC42NDIxIDIxLjE4MzhMMTguNDUxNCAxNC44NTA1TDE0LjQxNDYgMTguNDI2NFYxOC40MTg0Wk0yNi4wNzk5IDE4LjQyNjRMMjEuOTc5NiAxNC43NzFMMjEuODQ0NSAyMS4xODM4TDI3LjcyNDggMjAuOTEzNkwyNi4wNzk5IDE4LjQyNjRWMTguNDI2NFpNMTQuNzMyNCAyOS44Mjk1TDE4LjMwMDQgMjguMTEzTDE1LjIzMzEgMjUuNzI5MUwxNC43MzI0IDI5LjgyOTVaTTIyLjIwMjEgMjguMTA1MUwyNS43NDYyIDI5LjgyOTVMMjUuMjY5NCAyNS43MjEyTDIyLjIwMjEgMjguMTA1MVoiIGZpbGw9IiNFMjc2MjUiIHN0cm9rZT0iI0UyNzYyNSIgc3Ryb2tlLXdpZHRoPSIwLjE5ODY2MSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNS43NDQyIDI5LjgzTDIyLjIwMDEgMjguMTEzNUwyMi40ODYyIDMwLjQxOEwyMi40NTQ0IDMxLjM5NTRMMjUuNzQ0MiAyOS44M1pNMTQuNzMwNSAyOS44M0wxOC4wMzYyIDMxLjM5NTRMMTguMDEyMyAzMC40MThMMTguMjk4NCAyOC4xMTM1TDE0LjczMDUgMjkuODNaIiBmaWxsPSIjRDVCRkIyIiBzdHJva2U9IiNENUJGQjIiIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTguMDkyNSAyNC4xOTU3TDE1LjE1MjMgMjMuMzM3NUwxNy4yMzQzIDIyLjM4MzlMMTguMTAwNSAyNC4xOTU3SDE4LjA5MjVaTTIyLjM5MTUgMjQuMTk1N0wyMy4yNjU2IDIyLjM3NkwyNS4zNTU2IDIzLjMyOTVMMjIuMzkxNSAyNC4yMDM3VjI0LjE5NTdaIiBmaWxsPSIjMjMzNDQ3IiBzdHJva2U9IiMyMzM0NDciIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTQuNzMwMiAyOS44Mjk1TDE1LjI0NjcgMjUuNTg2MUwxMS45NjQ4IDI1LjY4MTRMMTQuNzMwMiAyOS44Mjk1Wk0yNS4yNDMzIDI1LjU4NjFMMjUuNzQ0IDI5LjgyOTVMMjguNTI1MiAyNS42ODE0TDI1LjI0MzMgMjUuNTg2MVpNMjcuNzMwNiAyMC45MTM2TDIxLjg1MDIgMjEuMTgzOEwyMi4zOTA2IDI0LjIwMzRMMjMuMjY0NyAyMi4zNzU3TDI1LjM1NDYgMjMuMzI5M0wyNy43MzA2IDIwLjkxMzZWMjAuOTEzNlpNMTUuMTUxNCAyMy4zMzcyTDE3LjIzMzMgMjIuMzgzN0wxOC4wOTk1IDI0LjE5NTRMMTguNjQ3OCAyMS4xNzU4TDEyLjc2NzQgMjAuOTEzNkwxNS4xNTE0IDIzLjMzNzJWMjMuMzM3MloiIGZpbGw9IiNDQzYyMjgiIHN0cm9rZT0iI0NDNjIyOCIgc3Ryb2tlLXdpZHRoPSIwLjE5ODY2MSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMi43Njk1IDIwLjkxMzZMMTUuMjMyOSAyNS43MjEyTDE1LjE1MzUgMjMuMzM3MkwxMi43Njk1IDIwLjkxMzZaTTI1LjM1NjcgMjMuMzM3MkwyNS4yNjEzIDI1LjcyMTJMMjcuNzI0NyAyMC45MTM2TDI1LjM1NjcgMjMuMzM3MlpNMTguNjQ5OSAyMS4xODM4TDE4LjA5MzYgMjQuMjAzNEwxOC43OTI5IDI3Ljc2MzRMMTguOTUxOSAyMy4wNjcxTDE4LjY0OTkgMjEuMTgzOFpNMjEuODQ0NCAyMS4xODM4TDIxLjU1ODMgMjMuMDU5MUwyMS43MDEzIDI3Ljc2MzRMMjIuMzkyNyAyNC4xOTU0TDIxLjg0NDQgMjEuMTc1OFYyMS4xODM4WiIgZmlsbD0iI0UyNzUyNSIgc3Ryb2tlPSIjRTI3NTI1IiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTIyLjM5MTcgMjQuMTk1NkwyMS43MDAzIDI3Ljc2MzZMMjIuMjAxIDI4LjExMzJMMjUuMjYwMyAyNS43MjkzTDI1LjM1NTcgMjMuMzM3NEwyMi4zOTE3IDI0LjE5NTZaTTE1LjE1MjUgMjMuMzM3NEwxNS4yMzE5IDI1LjcyMTNMMTguMjk5MyAyOC4xMDUzTDE4Ljc5MTkgMjcuNzYzNkwxOC4xMDA2IDI0LjE5NTZMMTUuMTQ0NSAyMy4zMzc0SDE1LjE1MjVaIiBmaWxsPSIjRjU4NDFGIiBzdHJva2U9IiNGNTg0MUYiIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjIuNDYyMyAzMS4zOTUzTDIyLjQ4NjIgMzAuNDE3OUwyMi4yMTYgMzAuMTk1NEgxOC4yNzQ2TDE4LjAxMjMgMzAuNDE3OUwxOC4wMzYyIDMxLjM5NTNMMTQuNzMwNSAyOS44Mjk4TDE1Ljg5MDYgMzAuNzgzNEwxOC4yMzQ4IDMyLjM5NjVIMjIuMjQ3OEwyNC41OTk5IDMwLjc3NTVMMjUuNzQ0MiAyOS44Mjk4TDIyLjQ1NDQgMzEuMzk1M0gyMi40NjIzWiIgZmlsbD0iI0MwQUM5RCIgc3Ryb2tlPSIjQzBBQzlEIiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTIyLjE5OTUgMjguMTA1NEwyMS42OTg5IDI3Ljc2MzdIMTguNzkwNUwxOC4yOTc4IDI4LjExMzNMMTguMDExNyAzMC40MTc4TDE4LjI3NCAzMC4xOTUzSDIyLjIxNTRMMjIuNDg1NiAzMC40MTc4TDIyLjE5OTUgMjguMTEzM1YyOC4xMDU0WiIgZmlsbD0iIzE2MTYxNiIgc3Ryb2tlPSIjMTYxNjE2IiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTMyLjczMjQgMTUuOTA3N0wzMy42MDY1IDExLjY1NjNMMzIuMjg3NCA3LjY4MzExTDIyLjE5NTQgMTUuMTUyN0wyNi4wODEyIDE4LjQxODdMMzEuNTY0MyAyMC4wMTZMMzIuNzcyMSAxOC42MDk0TDMyLjI0NzcgMTguMjI4TDMzLjA4MjEgMTcuNDY1MkwzMi40NDYzIDE2Ljk3MjVMMzMuMjgwNyAxNi4zMzY4TDMyLjcyNDUgMTUuOTA3N0gzMi43MzI0Wk02Ljg5MDYyIDExLjY0ODRMNy43ODA2MiAxNS45MDc3TDcuMjA4NDggMTYuMzI4OEw4LjA1ODc1IDE2Ljk2NDVMNy40MjMwNCAxNy40NjUyTDguMjQ5NDYgMTguMjI4TDcuNzI1IDE4LjYwOTRMOC45MzI4NiAyMC4wMTZMMTQuNDE1OSAxOC40MjY3TDE4LjMwMTcgMTUuMTQ0OEw4LjIwOTczIDcuNjgzMTFMNi44OTA2MiAxMS42NDg0WiIgZmlsbD0iIzc2M0UxQSIgc3Ryb2tlPSIjNzYzRTFBIiBzdHJva2Utd2lkdGg9IjAuMTk4NjYxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTMxLjU2NDYgMjAuMDE2TDI2LjA4MTUgMTguNDI2N0wyNy43MzQ0IDIwLjkxMzlMMjUuMjcxIDI1LjcyMTVMMjguNTI5IDI1LjY4MThIMzMuNDAwMkwzMS41NjQ2IDIwLjAxNlpNMTQuNDE2MiAxOC40MTg4TDguOTMzMTUgMjAuMDE2TDcuMTA1NDcgMjUuNjgxOEgxMS45NzY2TDE1LjIzNDcgMjUuNzIxNUwxMi43NzEzIDIwLjkxMzlMMTQuNDI0MSAxOC40MTg4SDE0LjQxNjJaTTIxLjg0NjEgMjEuMTg0MUwyMi4yMDM3IDE1LjE0NDhMMjMuNzkzIDEwLjg1MzhIMTYuNzA0OEwxOC4yOTQgMTUuMTQ0OEwxOC42NTE2IDIxLjE4NDFMMTguNzg2NyAyMy4wNzU0VjI3Ljc2MzhIMjEuNzAzMUwyMS43MTkgMjMuMDc1NEwyMS44NDYxIDIxLjE4NDFaIiBmaWxsPSIjRjU4NDFGIiBzdHJva2U9IiNGNTg0MUYiIHN0cm9rZS13aWR0aD0iMC4xOTg2NjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L2c+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwM184OTI0XzUyMDM5KSI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjEzLjMzMzMiIGZpbGw9IiNFOEU4RUQiLz4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfODkyNF81MjAzOSkiLz4KPHBhdGggZD0iTTMzLjI4IDIwLjA0MzlIMzAuMDA2N0MzMC4wMDY3IDEzLjM3MzMgMjQuNTgwMyA3Ljk2NjA2IDE3Ljg4NTkgNy45NjYwNkMxMS4yNzQ1IDcuOTY2MDYgNS44OTkzMiAxMy4yNDEgNS43Njc3NiAxOS43OTczQzUuNjMxNjYgMjYuNTc0NSAxMi4wMTI1IDMyLjQ1OTUgMTguODE0NiAzMi40NTk1SDE5LjY3MDNDMjUuNjY3MiAzMi40NTk1IDMzLjcwNDkgMjcuNzgxNyAzNC45NjA3IDIyLjA4MjFDMzUuMTkyNiAyMS4wMzE1IDM0LjM1OTcgMjAuMDQzOSAzMy4yOCAyMC4wNDM5VjIwLjA0MzlaTTEzLjAyMTggMjAuMzQxMUMxMy4wMjE4IDIxLjIzMzEgMTIuMjg5NiAyMS45NjI3IDExLjM5NDQgMjEuOTYyN0MxMC40OTkxIDIxLjk2MjcgOS43NjY5OSAyMS4yMzI4IDkuNzY2OTkgMjAuMzQxMVYxNy43MTc3QzkuNzY2OTkgMTYuODI1NyAxMC40OTkxIDE2LjA5NjEgMTEuMzk0NCAxNi4wOTYxQzEyLjI4OTYgMTYuMDk2MSAxMy4wMjE4IDE2LjgyNTcgMTMuMDIxOCAxNy43MTc3VjIwLjM0MTFaTTE4LjY3MjYgMjAuMzQxMUMxOC42NzI2IDIxLjIzMzEgMTcuOTQwNSAyMS45NjI3IDE3LjA0NTQgMjEuOTYyN0MxNi4xNTAxIDIxLjk2MjcgMTUuNDE4IDIxLjIzMjggMTUuNDE4IDIwLjM0MTFWMTcuNzE3N0MxNS40MTggMTYuODI1NyAxNi4xNTA0IDE2LjA5NjEgMTcuMDQ1NCAxNi4wOTYxQzE3Ljk0MDUgMTYuMDk2MSAxOC42NzI2IDE2LjgyNTcgMTguNjcyNiAxNy43MTc3VjIwLjM0MTFaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfODkyNF81MjAzOSkiLz4KPC9nPgo8L2c+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzYgNTZDNDkuODA3MSA1NiA1NiA0OS44MDcxIDU2IDM2QzU2IDIyLjE5MjkgNDkuODA3MSAxNiAzNiAxNkMyMi4xOTI5IDE2IDE2IDIyLjE5MjkgMTYgMzZDMTYgNDkuODA3MSAyMi4xOTI5IDU2IDM2IDU2Wk0zMi4yNDI5IDI0LjQ4MDZIMzcuODA2OFYzMy42NDk0SDM0LjM1NzFWMjcuNDMyMkgzMS4yNjY4TDMyLjI0MjkgMjQuNDgwNlpNMzUuOTk5OSA0Ny41MTkyQzM5LjUwNDMgNDcuNTE5MiA0Mi4zNDUyIDQ0LjY3ODMgNDIuMzQ1MiA0MS4xNzM4QzQyLjM0NTIgMzcuNjY5NCAzOS41MDQzIDM0LjgyODUgMzUuOTk5OSAzNC44Mjg1QzMyLjQ5NTQgMzQuODI4NSAyOS42NTQ1IDM3LjY2OTQgMjkuNjU0NSA0MS4xNzM4QzI5LjY1NDUgNDQuNjc4MyAzMi40OTU0IDQ3LjUxOTIgMzUuOTk5OSA0Ny41MTkyWk0zNS45OTk5IDQ0LjYzODVDMzcuOTEzMyA0NC42Mzg1IDM5LjQ2NDUgNDMuMDg3MyAzOS40NjQ1IDQxLjE3MzhDMzkuNDY0NSAzOS4yNjA0IDM3LjkxMzMgMzcuNzA5MiAzNS45OTk5IDM3LjcwOTJDMzQuMDg2NCAzNy43MDkyIDMyLjUzNTIgMzkuMjYwNCAzMi41MzUyIDQxLjE3MzhDMzIuNTM1MiA0My4wODczIDM0LjA4NjQgNDQuNjM4NSAzNS45OTk5IDQ0LjYzODVaIiBmaWxsPSIjMDBCODEyIi8+CjxwYXRoIGQ9Ik0zNy44MDg1IDI0LjQ4MDdIMzIuMjQ0NkwzMS4yNjg1IDI3LjQzMjNIMzQuMzU4OVYzMy42NDk1SDM3LjgwODVWMjQuNDgwN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNDIuMzQ3IDQxLjE3MzlDNDIuMzQ3IDQ0LjY3ODQgMzkuNTA2MSA0Ny41MTkzIDM2LjAwMTYgNDcuNTE5M0MzMi40OTcyIDQ3LjUxOTMgMjkuNjU2MyA0NC42Nzg0IDI5LjY1NjMgNDEuMTczOUMyOS42NTYzIDM3LjY2OTUgMzIuNDk3MiAzNC44Mjg2IDM2LjAwMTYgMzQuODI4NkMzOS41MDYxIDM0LjgyODYgNDIuMzQ3IDM3LjY2OTUgNDIuMzQ3IDQxLjE3MzlaTTM5LjQ2NjIgNDEuMTczOUMzOS40NjYyIDQzLjA4NzQgMzcuOTE1MSA0NC42Mzg2IDM2LjAwMTYgNDQuNjM4NkMzNC4wODgxIDQ0LjYzODYgMzIuNTM2OSA0My4wODc0IDMyLjUzNjkgNDEuMTczOUMzMi41MzY5IDM5LjI2MDQgMzQuMDg4MSAzNy43MDkzIDM2LjAwMTYgMzcuNzA5M0MzNy45MTUxIDM3LjcwOTMgMzkuNDY2MiAzOS4yNjA0IDM5LjQ2NjIgNDEuMTczOVoiIGZpbGw9IndoaXRlIi8+CjwvZz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl84OTI0XzUyMDM5IiB4MT0iMjAiIHkxPSIwIiB4Mj0iMjAiIHkyPSI0MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjNTM0QkIxIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzU1MUJGOSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXJfODkyNF81MjAzOSIgeDE9IjIwLjM4MjciIHkxPSI3Ljk2NjA2IiB4Mj0iMjAuMzgyNyIgeTI9IjMyLjQ1OTUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0id2hpdGUiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwLjgyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxjbGlwUGF0aCBpZD0iY2xpcDBfODkyNF81MjAzOSI+CjxyZWN0IHdpZHRoPSI1NiIgaGVpZ2h0PSI1NiIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPGNsaXBQYXRoIGlkPSJjbGlwMV84OTI0XzUyMDM5Ij4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMTMuMzMzMyIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPGNsaXBQYXRoIGlkPSJjbGlwMl84OTI0XzUyMDM5Ij4KPHJlY3Qgd2lkdGg9IjI3LjgxMjUiIGhlaWdodD0iMjYuMjIzMiIgZmlsbD0id2hpdGUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYuMDkzNzUgNi44ODgxOCkiLz4KPC9jbGlwUGF0aD4KPGNsaXBQYXRoIGlkPSJjbGlwM184OTI0XzUyMDM5Ij4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMTMuMzMzMyIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K',
    text: 'OneKey & Phantom',
  },
};
