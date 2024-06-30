import {useColyseusRoom} from "../utility/contexts";
import {useState} from "react";

export function ChoosePosition({callback}: { callback: () => void }) {
    let room = useColyseusRoom();

    let [value, setValue] = useState(0);

    return (
        <>
            <input type={"number"} value={value} onChange={e => setValue(e.target.valueAsNumber)}/>
            <button onClick={() => {
                room?.send("choosePosition", {index: value});
                callback()
            }}>Choose
            </button>
        </>
    )
}