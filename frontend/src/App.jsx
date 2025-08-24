import React, { useState } from 'react'; // <-- Must include this
import { ColorModeButton } from "./components/ui/color-mode"
import { Avatar, For, HStack, IconButton, Input, CloseButton, Group } from "@chakra-ui/react"
import { LuSearch } from "react-icons/lu"


const App = () => {

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setSearchQuery("");
  };



  return (
    <>
    <HStack gap="10">

      {/* Hearder for all pages */}
      <header>
        <nav>
          <a className="logo" href="#home">Logo</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
          <a href="about_us">About us</a>
        </nav>

      
      <div className="header-right">

        {!showSearch && (
          <IconButton
              aria-label="Call support"
              key={"ghost"}
              variant={"ghost"}
              onClick={toggleSearch}
            >
          <LuSearch />
        </IconButton>
        )}

        {showSearch && (
          <Group>
              <Input
                flex="1"
                width="500px"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                
              />

              <IconButton

                key={"ghost"}
                variant={"ghost"}
              >
                <LuSearch />
              </IconButton>

              <CloseButton 
                variant="ghost"
                onClick={toggleSearch}
              />
          </Group>
        )}

        {/* Dark Mode Toggle Button */}
        <ColorModeButton className="dark-mode-btn" />

        {/* Header for user login */}
        <a href="user_profile">
        <Avatar.Root colorPalette="grey">
          <Avatar.Fallback />
          <Avatar.Image src="https://bit.ly/broken-link" />
        </Avatar.Root>
        </a>

      </div>
      </header>

    </HStack>
    </>
  );
};

export default App;