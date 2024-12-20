/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export const Logo = ({ style }: { style: any }) => (
  <img
    alt="OneKey Logo"
    style={style}
    src="data:image/webp;base64,UklGRswEAABXRUJQVlA4WAoAAAAQAAAALwAALwAAQUxQSCgDAAABoGTbtuq6OdLTNzPbxXCJoehehJlKbkKYmZMGMDPUmZmZOWaM3tN9axXuvVKaEBETEPXhvIhYdOw5Nz35xld//wf//f3Vm0/edO6xiyJi3jBmHsxFLD7poZ/9H39+6KRFEXODGZphLL/iN9WubbvUo/Spa8ed6m9XrohhM9Uo4oKtmtqut47FvmuTbj0/YjTFXMx7StuEIrnUVVKrT82LucooVnxqmwQBpCpI0dT6yYoYFZqY94kHEAEpioW6HPCTedFExGAYT3nAgiAguRRFBA/4VAwHEXNxgS1SFdQMC1O2XhBzMYwV20wCgswuCAImt66I4by4ylYyQRAsZ4CCgK1XxbxY8rsJEBAQLFMUkGLy9yURp5goSXkaC5ILyVMiHrGVXFGclrKiKLY+Ekt+tSuoACI1MxVAtPPXJSdor1QFhApSFdReT7jQTgRBM5lB0Ayw84LbbAXQkhkVQEsKtt72bEFUBMGaIiqCYPbsu04EECqIZQChAk589zuTIAioIDURBFQQk99ttS8IIgKiKIAIIgLau3UsqqCAgoIqqqCABXAMKAKCIGKdXBDEDGRKEcBZQAQkHwvmILnToyC5II632otK2VmkqoC9W783SVnyAgg1KarJH953UhIUVMGMgqAg4MQPXrQTpCiWcovkAoidL91rK3WhJAJTCWDrPVvsNBNrkltERDDr3LJZ+kI9M6NUFexx89q/nAiCYE2sgiC5E/9aE8/ZSq4gUKgDChZan4u4yAmAgBSnAgEpJy+K2LTVVJJcmElySW7dFKO421YARXEqBFAUsfXuGA3jkL32ggogoohQUMnt3XtIDKOJS+ykLCgIYKko2HpJNBGDmPeKYwXNchFLgiKOfWVeDCKiiYN+cawlZUYtOPaXg6KJvIljfrXrRRAEFEVEBfvOX4+JJspNHPGmdj0ouQgKoNB3+uYR0US9ieXX79fUJTAHsdinLun+65dHE9M2ESfev0tl0k1S6rM+TSbdBHXXfSdGNDH9YBhx1MUv77CK9R0vX3x0xHAQMw8HEYuOPOO6x1778redLbQ7f/vytceuPeOoRRGDYdQBVlA4IH4BAACQCACdASowADAAPpE2lkiloqIhMdZqALASCWkABRXm1xMlLv4/sMpVEDsQhAZmdBuj/t2DLLfSj9jeN2h/33kRqlO8uEYD82VJykmZgAD++u9Yi1iq75P1V2sgP+qtpKI6W2w+S89zFwU6NocVAgS4Ahpa8cwJdBVEzwmXPHuS+Bkf1jepfuaBisZjtz5k66v9TsX4ZHJ5vxopXrXVhzZQUpWcle5eRr0hlxA/4qZCdCu7tBQ5hgNercW+3c8xj+8Y/zuF1X58pDYUF3k54O/II2gG8Dqeo/A55jNiCpze2OAuo27ogApJXra1b+faewFXX38yPcZcdAUmJbAX3uojPiByizCXOCi4wxWsVeiO7lp3pZm8f0ZyYUdSt4Zp0OC1vqmHm6T91y+5ksk6nQ1HLhk4+cITpVoLHyAFiOAJR65xrUvCXEZkm4vPDlcD+/++gTsKJ77gEkOU8XBObUsURriu7kcnYOLmxbgVkhgyFKQgHakg1e2tS8mJzSAA"
  />
)

export const HighRisk = ({ style }: { style: any }) => (
  <img 
    style={style}
    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAgCAYAAACYTcH3AAACrElEQVRYCe1XvW5TMRT+fFMCBNGBNQ8AL8CAxERLB6ZIzJGY6QO0UmekdkViBqkrAxNDaF+AvkBfAEYGQgsq3GvOZ/cqvonta1uRWPAS/xyf893j7/wE+D/8HlD+7bTdEwwnDaqJgn54feNc5sfbuPqQpqErVQzmE4b7gJp21bUrffwUV4ftKvW3ShV05eiRMBBKqqmVcW/1z7M98xH3Noe4eK+BcUy9hpr/wWjnGb59j8m5Z9me2cDFtA8IDQh37lLWNdY3z/LMKW6PGzSzPqXtOb0zgHq+hZ9f2r3Yb5ZnNPTLmLLlM3qnhn61vB9aJ4MhIQWMEDdvMOxPMGpDP3o5GYywIMsrrtUGdZJ3ksDMcCuJtC4Ady7EHM9wc9fd8817wZC0FXQwKhqor79x51GFakcMnPuM2D01ZVoInwO9YEjaWCgP0LxhLmHEsBSEjJHMN/Aj+tRRMPRKCWlDgGxmDpM5CkajeRtWXHYieSrInSAYG8rxlF8Cx4Y6a9vq8IKxRCsP5VUz3R1pO/Z9ZPaCSa0/XRPpK5LZV7dWwJC0kheirHfNSqQ9WKyrpExr5dWUthZ3gQ13wXlu/WGESFI0gORuMhh6pwaYmV/QLkfHM6X1R5QwxyT3Lda0aTM6dWvJM/mkVRgcbOPS9LwsiBr1u9ZYyu913WL2XnimpP6wX2mBUJnMz+R7szzk1i3zTH31h4Z8g+/uktDOdbT++PSQdwx180zSAD0hQr9gfLeWLC1ePaKUZOy9uLT/lB9V4XJiwCgoiQIJ0oJhP0K/5tUyDdaoALlvnkmQzQtwrPWKtCKbBkwT7UPWajOorII6NWBG+CWhmRcFQa0FB2zQ5HXODJjHwFwmB/8CENOD5KpD25w5X8LQZDmQZ9siw52jtU8tCP1Z2tWj9n/VX19Qwam7VmWvAAAAAElFTkSuQmCC"
  />
)

export const MediumRsik = ({ style }: { style: any }) => (
  <img
    style={style}
    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAYAAAAfrhY5AAABk0lEQVRIDe2XPU7DQBCF3zqRaEgukAuEAyS0AaWhA1qkhJ5cAA6DZEu0IaKhAQ4QDoAvkAvEDRTx8mbJILceJyshsZK1uyPNfLMz+zN2qLSrM3TbnzhHgn5FvLOh93insWX2hpUYdWr5eoR+mSDlvKuyPfUCvqMDywCfnKJHwZzfvsFhPd6hcB4Xicw4uYkFFh7BHXazAOdkKMLIbRDghErYY7eewmODA88M5z7JNwc4ppWxjC3em+HcJ9nDM9ZyZmUcFc4L4/ci4soHFrie8w+LMqFL0bOelrYFqjpWqOpbcz5lro/ko6F4G845vMq9rN5H3XAlMJTXT+FN+tphZ547rS/MJyOMm4BFtzZ8C+xRUx6HRs0KbwRV5X+4RiJq/zfD7iq7XY6fJWTmu730mE1PfpB8YKQGrN3McFktobe1iRUFzfm6Ios2VHgRjbgFeSBX+CI2PEnwGODtQ6TMn6kINDq9Sl+QBfj9U/h9mdFQjAgsWPVeitOhhqt6L281n0wtDnfyM+FaWPsNCkJzqXiV9w3zlWKqZDoCQAAAAABJRU5ErkJggg=="
  />
)