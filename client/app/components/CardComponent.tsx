import {forwardRef, HTMLAttributes} from "react";
import {Card, CardNames} from "../../../server/shared/card";

interface CardComponentProps {
  card: Card
}

export const CardComponent = forwardRef<HTMLDivElement, CardComponentProps & HTMLAttributes<HTMLDivElement>>(({card, ...props}, ref) => {
  return (
    <div ref={ref} {...props} className={"w-36 h-[200px] rounded-md bg-gray-700 text-center"}>
      <img alt={CardNames.get(card)} src={"static/cards/" + card + ".png"}/>
    </div>
  )
});