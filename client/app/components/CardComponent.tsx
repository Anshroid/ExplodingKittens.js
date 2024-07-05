import {forwardRef, HTMLAttributes} from "react";
import {Card, CardNames} from "../../../server/shared/card";

interface CardComponentProps {
  card: Card
}

export const CardComponent = forwardRef<HTMLDivElement, CardComponentProps & HTMLAttributes<HTMLDivElement>>(({card, ...props}, ref) => {
  return (
    <div ref={ref} {...props} className={"w-36 h-40 outline rounded-md bg-gray-900 text-center"}>{CardNames.get(card)}</div>
  )
});