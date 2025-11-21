/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState } from "react";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import CheckboxTree from "react-checkbox-tree";
import AppLoader from "@/components/app-loader";
import "react-datepicker/dist/react-datepicker.css";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  MinusSquare,
  PlusSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Select from "react-select";

type HomePageClientProps = {
  roles: any[];
  menus: any[];
};

export default function ClientComponent({ roles, menus }: HomePageClientProps) {
  const [groups, setGroups] = useState<any>(
    roles
      .filter((item) => {
        return item.RoleID !== 1;
      })
      .map((item) => ({
        value: item.RoleID,
        label: item.RoleName,
      }))
  );
  const [state, setState] = useState({
    checked: [] as string[],
    expanded: [] as string[],
  });
  const [tree, setTree] = useState<any>([]);
  const [currentGroupId, setCurrentGroupId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const mainMenus = menus.filter((item: any) => item.parentID === null);
    const x = mainMenus.map((mainMenu: any) => ({
      value: mainMenu.menuID,
      label: mainMenu.name,
      className: "text-2xl",
      children: menus
        .filter((element: any) => element.parentID === mainMenu.menuID)
        .map((item: any) => ({
          value: item.menuID,
          label: item.name,
          className: "text-lg",
        })),
    }));
    setTree(x);
  }, []);

  const onSubmit = async () => {
    const mainCodes = [] as string[];

    state.checked.forEach((item) => {
      const code = item.slice(0, 2);
      if (!mainCodes.includes(code)) {
        mainCodes.push(code);
      }
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/update-GroupMenus`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FK_GroupID: currentGroupId,
          FK_MenuIDs: [...mainCodes, ...state.checked].join(","),
        }),
      }
    );

    if (response.ok)
      toast({
        duration: 8000,
        description: "Access permission edited successfully.",
      });
    else
      toast({
        variant: "destructive",
        description: "Access permission edit failed.",
      });
  };

  const handleChange = async ({ value }: any) => {
    setCurrentGroupId(value);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/get-menusByRole?roleID=${value}`,
      {
        cache: "no-store",
      }
    );
    if (res.status === 200) {
      const body = await res.json();
      const x = body
        .filter((item: any) => item.menuID.length > 2)
        .map((element: any) => element.menuID);
      setState({
        checked: x,
        expanded: [],
      });
    }

    setIsLoading(false);
  };

  return (
    <div className='p-6 bg-white shadow-md rounded-md'>
      <h1 className='text-2xl font-bold mb-4'>Access Permission</h1>

      <div className='w-3/6 flex items-center gap-4 mb-5'>
        <Select
          defaultValue={undefined}
          options={groups}
          value={groups.find((option: any) => option.value === currentGroupId)}
          onChange={(val) => {
            setIsLoading(true);
            handleChange(val);
          }}
          placeholder='Group Name'
          className='react-select-container'
          classNamePrefix='react-select'
        />

        <Button className='px-14 flex' onClick={onSubmit} disabled={isLoading}>
          Save
        </Button>
      </div>

      <CheckboxTree
        nodes={tree}
        checked={state.checked}
        expanded={state.expanded}
        onCheck={(checked) => setState({ ...state, checked })}
        onExpand={(expanded) => setState({ ...state, expanded })}
        icons={{
          check: <CheckSquare color='red' />,
          uncheck: <Square color='red' />,
          halfCheck: <CheckSquare color='red' />,
          expandClose: <ChevronRight color='blue' />,
          expandOpen: <ChevronDown color='blue' />,
          expandAll: <PlusSquare color='blue' />,
          collapseAll: <MinusSquare color='blue' />,
          parentClose: <Folder color='green' />,
          parentOpen: <FolderOpen color='green' />,
          leaf: <File color='green' />,
        }}
      />

      {isLoading && <AppLoader />}
    </div>
  );
}
