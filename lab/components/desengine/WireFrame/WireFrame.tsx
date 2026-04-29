import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { shrink } from "./style";

type WireFrameProps = {
    title?: string;
    className?: string;
    children?: ReactNode;
};

function WireFrame({title, className=shrink, children}: WireFrameProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription></CardDescription>
            </CardHeader>
            <CardContent className={className}>
                {children}
            </CardContent>
            <CardFooter></CardFooter>
        </Card>
    );
}

export { 
    WireFrame,
    type WireFrameProps
}